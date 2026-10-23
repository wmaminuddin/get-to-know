import { useEffect, useMemo, useState } from 'react'
import { WaitingState } from '../components/WaitingState'
import {
  advanceProgress,
  getQuestions,
  otherPlayerId,
  playerName,
  setStatusFinale,
  submitAnswer,
} from '../lib/sessionApi'
import type { Session } from '../types'

interface Props {
  code: string
  playerId: string
  session: Session
}

export function PlayRound({ code, playerId, session }: Props) {
  const questions = getQuestions(session)
  const total = questions.length
  const partnerId = otherPlayerId(session, playerId)
  const myIndex = session.progress?.[playerId]?.currentIndex ?? 0
  const partnerIndex = partnerId
    ? (session.progress?.[partnerId]?.currentIndex ?? 0)
    : 0

  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If I've advanced past the deck, nudge session to finale
  useEffect(() => {
    if (myIndex >= total && total > 0) {
      void setStatusFinale(code)
    }
  }, [myIndex, total, code])

  // Reset local text when index changes
  useEffect(() => {
    setText('')
    setError(null)
  }, [myIndex])

  const index = myIndex
  const question = questions[index]
  const myAnswer = session.answers?.[String(index)]?.[playerId]
  const partnerAnswer = partnerId
    ? session.answers?.[String(index)]?.[partnerId]
    : undefined

  const phase = useMemo(() => {
    if (total === 0) return 'loading' as const
    if (myIndex >= total) return 'toFinale' as const
    // Waiting for partner to catch up to this question
    if (partnerIndex < myIndex) return 'waitContinue' as const
    if (!myAnswer) return 'answering' as const
    if (!partnerAnswer) return 'waiting' as const
    return 'reveal' as const
  }, [total, myIndex, partnerIndex, myAnswer, partnerAnswer])

  async function send(skipped: boolean) {
    if (!question) return
    setBusy(true)
    setError(null)
    try {
      const trimmed = text.trim()
      if (!skipped && !trimmed) {
        setError('Write an answer, or skip.')
        setBusy(false)
        return
      }
      await submitAnswer(code, playerId, index, {
        text: skipped ? null : trimmed,
        skipped,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save answer.')
    } finally {
      setBusy(false)
    }
  }

  async function handleNext() {
    setBusy(true)
    setError(null)
    try {
      const next = index + 1
      await advanceProgress(code, playerId, next)
      if (next >= total) {
        await setStatusFinale(code)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not continue.')
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'loading' || !question) {
    return (
      <div className="screen">
        <WaitingState title="Loading questions…" />
      </div>
    )
  }

  if (phase === 'toFinale') {
    return (
      <div className="screen">
        <WaitingState title="Wrapping up…" detail="One last question." />
      </div>
    )
  }

  if (phase === 'waitContinue') {
    return (
      <div className="screen">
        <p className="progress">
          {Math.min(myIndex + 1, total)} / {total}
        </p>
        <WaitingState
          title="Waiting for them to continue…"
          detail={`${playerName(session, partnerId)} is still on the previous reveal.`}
        />
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="screen">
        <p className="progress">
          {index + 1} / {total}
        </p>
        <p className="question-text">{question.text}</p>
        <WaitingState
          title="Waiting for their answer…"
          detail="You will both see the reveal together."
        />
      </div>
    )
  }

  if (phase === 'reveal') {
    return (
      <div className="screen">
        <div className="screen-head">
          <p className="progress">
            {index + 1} / {total}
          </p>
          <p className="eyebrow">Reveal</p>
          <p className="question-text">{question.text}</p>
        </div>
        <div className="reveal-grid">
          <div className="reveal-pane">
            <div className="who">You</div>
            <p className={`answer ${myAnswer?.skipped ? 'skipped' : ''}`}>
              {myAnswer?.skipped ? 'Skipped' : myAnswer?.text}
            </p>
          </div>
          <div className="reveal-pane">
            <div className="who">{playerName(session, partnerId)}</div>
            <p className={`answer ${partnerAnswer?.skipped ? 'skipped' : ''}`}>
              {partnerAnswer?.skipped ? 'Skipped' : partnerAnswer?.text}
            </p>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="btn-row">
          <button className="btn btn-primary" disabled={busy} onClick={handleNext}>
            {index + 1 >= total ? 'Continue to finale' : 'Next question'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="progress">
          {index + 1} / {total}
        </p>
        <p className="eyebrow">
          {question.source === 'system' ? 'Together' : 'From one of you'}
        </p>
        <p className="question-text">{question.text}</p>
      </div>
      <div className="field">
        <label htmlFor="answer">Your answer</label>
        <textarea
          id="answer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type freely…"
          maxLength={800}
        />
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="btn-row">
        <button className="btn btn-primary" disabled={busy} onClick={() => send(false)}>
          {busy ? 'Sending…' : 'Submit answer'}
        </button>
        <button className="btn btn-danger" disabled={busy} onClick={() => send(true)}>
          Skip
        </button>
      </div>
    </div>
  )
}
