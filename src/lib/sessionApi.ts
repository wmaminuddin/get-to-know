import {
  get,
  onValue,
  ref,
  runTransaction,
  set,
  update,
  type Unsubscribe,
} from 'firebase/database'
import { getDb } from '../firebase'
import type {
  Answer,
  FinaleAnswer,
  Session,
  SessionQuestion,
} from '../types'
import { generatePlayerId, generateSessionCode, normalizeCode } from './codes'
import { buildDeck, resolveSystemQuestionTexts } from './deck'
import {
  clampQuestionsPerPerson,
  DEFAULT_QUESTIONS_PER_PERSON,
  getQuestionsPerPerson,
} from './questionCount'
import {
  DEFAULT_SESSION_MODE,
  getSessionMode,
  isSessionMode,
  normalizeFinalePrompt,
  type SessionMode,
} from './sessionModes'

function sessionRef(code: string) {
  return ref(getDb(), `sessions/${code}`)
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out. Check VITE_FIREBASE_DATABASE_URL matches your Realtime Database (regional URLs end in .firebasedatabase.app).`,
        ),
      )
    }, ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

export async function createSession(
  name: string,
  questionsPerPerson = DEFAULT_QUESTIONS_PER_PERSON,
  options?: { mode?: SessionMode; finalePrompt?: string },
): Promise<{
  code: string
  playerId: string
}> {
  const db = getDb()
  let code = generateSessionCode()
  // Rare collision retry
  for (let i = 0; i < 5; i++) {
    const snap = await withTimeout(get(ref(db, `sessions/${code}`)), 12000, 'Database read')
    if (!snap.exists()) break
    code = generateSessionCode()
  }

  const playerId = generatePlayerId()
  const now = Date.now()
  const sessionMode = isSessionMode(options?.mode)
    ? options!.mode!
    : DEFAULT_SESSION_MODE
  const finalePrompt = normalizeFinalePrompt(
    options?.finalePrompt ?? getSessionMode(sessionMode).defaultFinalePrompt,
    sessionMode,
  )
  const session: Session = {
    createdAt: now,
    status: 'lobby',
    hostId: playerId,
    questionsPerPerson: clampQuestionsPerPerson(questionsPerPerson),
    sessionMode,
    finalePrompt,
    players: {
      [playerId]: {
        name: name.trim() || 'Player 1',
        joinedAt: now,
        questionsReady: false,
        isHost: true,
      },
    },
    progress: {
      [playerId]: { currentIndex: 0 },
    },
  }
  await withTimeout(set(sessionRef(code), session), 12000, 'Creating room')
  return { code, playerId }
}

export async function joinSession(
  rawCode: string,
  name: string,
): Promise<{ code: string; playerId: string }> {
  const code = normalizeCode(rawCode)
  if (code.length < 4) throw new Error('Enter a valid session code.')

  const snap = await get(sessionRef(code))
  if (!snap.exists()) throw new Error('No session found with that code.')

  const session = snap.val() as Session
  const playerCount = Object.keys(session.players ?? {}).length
  if (playerCount >= 2) throw new Error('This session is already full.')
  if (session.status !== 'lobby') {
    throw new Error('This session has already started.')
  }

  const playerId = generatePlayerId()
  const now = Date.now()
  await update(ref(getDb(), `sessions/${code}/players/${playerId}`), {
    name: name.trim() || 'Player 2',
    joinedAt: now,
    questionsReady: false,
    isHost: false,
  })
  await update(ref(getDb(), `sessions/${code}/progress/${playerId}`), {
    currentIndex: 0,
  })
  await update(sessionRef(code), { status: 'writing' })
  return { code, playerId }
}

export function subscribeSession(
  code: string,
  cb: (session: Session | null) => void,
): Unsubscribe {
  return onValue(sessionRef(code), (snap) => {
    cb(snap.exists() ? (snap.val() as Session) : null)
  })
}

export async function submitQuestions(
  code: string,
  playerId: string,
  questions: string[],
  expectedCount: number,
): Promise<void> {
  const cleaned = questions.map((q) => q.trim()).filter(Boolean)
  const n = clampQuestionsPerPerson(expectedCount)
  if (cleaned.length !== n) {
    throw new Error(`Please enter exactly ${n} questions.`)
  }
  await update(ref(getDb(), `sessions/${code}/players/${playerId}`), {
    questions: cleaned,
    questionsReady: true,
  })
}

/** Build shared deck once both players are ready (safe under concurrency). */
export async function tryBuildDeck(code: string): Promise<boolean> {
  const sRef = sessionRef(code)
  const snap = await get(sRef)
  if (!snap.exists()) return false

  const preview = snap.val() as Session
  if (preview.deckBuilt || preview.questions?.length) return false

  const perPerson = getQuestionsPerPerson(preview)
  const players = preview.players ?? {}
  const ids = Object.keys(players)
  if (ids.length !== 2) return false
  if (
    !ids.every(
      (id) =>
        players[id]?.questionsReady &&
        players[id]?.questions?.length === perPerson,
    )
  ) {
    return false
  }

  const [a, b] = ids as [string, string]
  const aQs = players[a]!.questions!
  const bQs = players[b]!.questions!
  // AI outside the transaction (async); bank fills any gaps / failures.
  const systemTexts = await resolveSystemQuestionTexts(
    [...aQs, ...bQs],
    perPerson,
    preview.sessionMode,
  )

  let built = false
  await runTransaction(sRef, (current) => {
    if (!current) return current
    const session = current as Session
    if (session.deckBuilt || session.questions?.length) return session

    const livePlayers = session.players ?? {}
    const liveIds = Object.keys(livePlayers)
    if (liveIds.length !== 2) return session
    const n = getQuestionsPerPerson(session)
    if (
      !liveIds.every(
        (id) =>
          livePlayers[id]?.questionsReady &&
          livePlayers[id]?.questions?.length === n,
      )
    ) {
      return session
    }

    const [idA, idB] = liveIds as [string, string]
    const deck = buildDeck(
      session.hostId,
      [idA, idB],
      {
        [idA]: livePlayers[idA]!.questions!,
        [idB]: livePlayers[idB]!.questions!,
      },
      n,
      systemTexts,
      session.sessionMode,
    )

    built = true
    return {
      ...session,
      questionsPerPerson: n,
      questions: deck,
      deckBuilt: true,
      status: 'answering',
      progress: {
        [idA]: { currentIndex: 0 },
        [idB]: { currentIndex: 0 },
      },
    }
  })
  return built
}

export async function submitAnswer(
  code: string,
  playerId: string,
  questionIndex: number,
  payload: { text: string | null; skipped: boolean },
): Promise<void> {
  const answer: Answer = {
    text: payload.skipped ? null : payload.text,
    skipped: payload.skipped,
    at: Date.now(),
  }
  await set(
    ref(getDb(), `sessions/${code}/answers/${questionIndex}/${playerId}`),
    answer,
  )
}

export async function advanceProgress(
  code: string,
  playerId: string,
  nextIndex: number,
): Promise<void> {
  await update(ref(getDb(), `sessions/${code}/progress/${playerId}`), {
    currentIndex: nextIndex,
  })
}

export async function setStatusFinale(code: string): Promise<void> {
  await runTransaction(sessionRef(code), (current) => {
    if (!current) return current
    const session = current as Session
    if (session.status === 'finale' || session.status === 'done') return session
    return { ...session, status: 'finale' }
  })
}

export async function submitFinale(
  code: string,
  playerId: string,
  nextDate: boolean,
): Promise<void> {
  const answer: FinaleAnswer = { nextDate, at: Date.now() }
  await set(ref(getDb(), `sessions/${code}/finale/${playerId}`), answer)
}

export async function setStatusDone(code: string): Promise<void> {
  await update(sessionRef(code), { status: 'done' })
}

export async function ensureWritingStatus(code: string): Promise<void> {
  await runTransaction(sessionRef(code), (current) => {
    if (!current) return current
    const session = current as Session
    const count = Object.keys(session.players ?? {}).length
    if (count >= 2 && session.status === 'lobby') {
      return { ...session, status: 'writing' }
    }
    return session
  })
}

export function otherPlayerId(
  session: Session,
  me: string,
): string | null {
  const ids = Object.keys(session.players ?? {})
  return ids.find((id) => id !== me) ?? null
}

export function playerName(session: Session, id: string | null): string {
  if (!id) return 'Them'
  return session.players?.[id]?.name || 'Them'
}

export function getQuestions(session: Session): SessionQuestion[] {
  return session.questions ?? []
}
