import { useMemo, useState } from 'react'
import { WaitingState } from '../components/WaitingState'
import { isAiConfigured } from '../lib/aiQuestions'
import { getQuestionsPerPerson } from '../lib/questionCount'
import { submitQuestions, tryBuildDeck } from '../lib/sessionApi'
import type { Session } from '../types'

interface Props {
  code: string
  playerId: string
  session: Session
}

export function WriteQuestions({ code, playerId, session }: Props) {
  const perPerson = getQuestionsPerPerson(session)
  const totalRound = perPerson * 3
  const me = session.players?.[playerId]
  const alreadyReady = Boolean(me?.questionsReady)
  const [questions, setQuestions] = useState<string[]>(() =>
    Array.from({ length: perPerson }, (_, i) => me?.questions?.[i] ?? ''),
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const filled = useMemo(
    () => questions.filter((q) => q.trim().length > 0).length,
    [questions],
  )

  async function handleSubmit() {
    setBusy(true)
    setError(null)
    try {
      await submitQuestions(code, playerId, questions, perPerson)
      // Only the host runs AI + deck build (guest relies on App's host effect).
      if (playerId === session.hostId) {
        await tryBuildDeck(code)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save questions.')
    } finally {
      setBusy(false)
    }
  }

  if (alreadyReady || me?.questionsReady) {
    const partnerReady = Object.entries(session.players ?? {})
      .filter(([id]) => id !== playerId)
      .every(([, p]) => p.questionsReady)
    return (
      <div className="screen">
        <div className="screen-head">
          <p className="eyebrow">Your questions are in</p>
          <h1>Almost ready</h1>
        </div>
        <WaitingState
          title={partnerReady ? 'Building your deck…' : 'Waiting for their questions…'}
          detail={
            partnerReady
              ? isAiConfigured()
                ? `Writing ${perPerson} complementary questions with AI, then assembling ${totalRound} total.`
                : `Putting together ${totalRound} shared questions.`
              : `They are still writing their ${perPerson} questions.`
          }
        />
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Round one</p>
        <h1>What do you want to know?</h1>
        <p className="muted">
          Write {perPerson} questions for the other person. You will answer them too.
        </p>
        <p className="progress">
          {filled} / {perPerson} filled
        </p>
      </div>
      <div className="q-list">
        {questions.map((q, i) => (
          <div className="q-item" key={i}>
            <span className="num">{i + 1}</span>
            <div className="field">
              <label className="visually-hidden" htmlFor={`q-${i}`}>
                Question {i + 1}
              </label>
              <input
                id={`q-${i}`}
                value={q}
                onChange={(e) => {
                  const next = [...questions]
                  next[i] = e.target.value
                  setQuestions(next)
                }}
                placeholder={`Question ${i + 1}`}
                maxLength={160}
              />
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={busy || filled !== perPerson}
          onClick={handleSubmit}
        >
          {busy ? 'Saving…' : `Submit my ${perPerson} questions`}
        </button>
      </div>
      <style>{`.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}`}</style>
    </div>
  )
}
