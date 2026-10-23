import { SYSTEM_QUESTIONS, type BankQuestion, type Depth } from '../data/systemQuestions'
import type { QuestionSource, SessionQuestion } from '../types'
import { generateComplementaryQuestions } from './aiQuestions'
import { depthTargets } from './questionCount'

const STOP = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'for',
  'is',
  'are',
  'do',
  'you',
  'your',
  'what',
  'when',
  'where',
  'how',
  'why',
  'who',
  'with',
  'about',
  'have',
  'has',
  'was',
  'were',
  'be',
  'been',
  'this',
  'that',
  'it',
  'from',
  'as',
  'at',
  'by',
  'if',
  'my',
  'me',
  'i',
  'we',
  'our',
  'their',
  'they',
  'them',
  'would',
  'could',
  'should',
  'can',
  'will',
  'just',
  'most',
  'more',
  'than',
  'into',
])

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
  return new Set(tokens)
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const t of a) {
    if (b.has(t)) n++
  }
  return n
}

function nearDuplicate(bank: BankQuestion, userTokens: Set<string>[]): boolean {
  const bankTokens = tokenize(bank.text)
  for (const theme of bank.themes) {
    bankTokens.add(theme.toLowerCase())
  }
  for (const ut of userTokens) {
    const o = overlapScore(bankTokens, ut)
    const denom = Math.min(bankTokens.size, ut.size) || 1
    if (o / denom >= 0.55 || o >= 4) return true
  }
  return false
}

/**
 * Pick complementary questions from the bank.
 * Prefer low keyword/theme overlap; depth mix ~30% / 40% / 30%.
 */
export function pickSystemQuestions(
  userQuestions: string[],
  count: number,
): BankQuestion[] {
  const userTokenSets = userQuestions.map(tokenize)
  const userThemeBag = new Set<string>()
  for (const q of userQuestions) {
    for (const t of tokenize(q)) userThemeBag.add(t)
  }

  const scored = SYSTEM_QUESTIONS.map((q) => {
    const qTokens = tokenize(q.text)
    for (const theme of q.themes) qTokens.add(theme.toLowerCase())
    let score = 0
    for (const ut of userTokenSets) score += overlapScore(qTokens, ut)
    for (const theme of q.themes) {
      if (userThemeBag.has(theme.toLowerCase())) score += 1.5
    }
    return { q, score, dup: nearDuplicate(q, userTokenSets) }
  })
    .filter((x) => !x.dup)
    .sort((a, b) => a.score - b.score || a.q.text.localeCompare(b.q.text))

  const targets = depthTargets(count)
  const picked: BankQuestion[] = []
  const used = new Set<string>()

  for (const depth of [1, 2, 3] as Depth[]) {
    const pool = scored.filter((x) => x.q.depth === depth && !used.has(x.q.text))
    for (const item of pool) {
      if (picked.filter((p) => p.depth === depth).length >= targets[depth]) break
      picked.push(item.q)
      used.add(item.q.text)
    }
  }

  for (const item of scored) {
    if (picked.length >= count) break
    if (used.has(item.q.text)) continue
    picked.push(item.q)
    used.add(item.q.text)
  }

  if (picked.length < count) {
    for (const q of SYSTEM_QUESTIONS) {
      if (picked.length >= count) break
      if (used.has(q.text)) continue
      picked.push(q)
      used.add(q.text)
    }
  }

  return picked.slice(0, count)
}

/**
 * Prefer AI complementary questions; fill gaps / fall back to curated bank.
 */
export async function resolveSystemQuestionTexts(
  userQuestions: string[],
  count: number,
): Promise<string[]> {
  const bank = pickSystemQuestions(userQuestions, count).map((q) => q.text)
  if (count <= 0) return []

  const ai = await generateComplementaryQuestions(userQuestions, count)
  if (!ai?.length) return bank

  const seen = new Set(ai.map((q) => q.toLowerCase()))
  const merged = [...ai]
  for (const b of bank) {
    if (merged.length >= count) break
    if (seen.has(b.toLowerCase())) continue
    seen.add(b.toLowerCase())
    merged.push(b)
  }
  return merged.slice(0, count)
}

export function buildDeck(
  hostId: string,
  playerIds: [string, string],
  questionsByPlayer: Record<string, string[]>,
  questionsPerPerson: number,
  systemTexts?: string[],
): SessionQuestion[] {
  const [idA, idB] =
    playerIds[0] === hostId
      ? playerIds
      : playerIds[1] === hostId
        ? ([playerIds[1], playerIds[0]] as [string, string])
        : ([...playerIds].sort() as [string, string])

  const aQs = questionsByPlayer[idA] ?? []
  const bQs = questionsByPlayer[idB] ?? []
  const system =
    systemTexts && systemTexts.length >= questionsPerPerson
      ? systemTexts.slice(0, questionsPerPerson)
      : pickSystemQuestions([...aQs, ...bQs], questionsPerPerson).map((q) => q.text)

  const deck: SessionQuestion[] = []
  aQs.forEach((text, i) => {
    deck.push({ id: `a-${i}`, text, source: 'a' as QuestionSource })
  })
  bQs.forEach((text, i) => {
    deck.push({ id: `b-${i}`, text, source: 'b' as QuestionSource })
  })
  system.forEach((text, i) => {
    deck.push({ id: `s-${i}`, text, source: 'system' })
  })
  return deck
}
