import { useEffect, useState } from 'react'
import { WaitingState } from '../components/WaitingState'
import {
  otherPlayerId,
  playerName,
  setStatusDone,
  submitFinale,
} from '../lib/sessionApi'
import { getFinalePrompt } from '../lib/sessionModes'
import type { Session } from '../types'

interface Props {
  code: string
  playerId: string
  session: Session
}

export function Finale({ code, playerId, session }: Props) {
  const partnerId = otherPlayerId(session, playerId)
  const mine = session.finale?.[playerId]
  const theirs = partnerId ? session.finale?.[partnerId] : undefined
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prompt = getFinalePrompt(session)

  useEffect(() => {
    if (mine && theirs && session.status !== 'done') {
      void setStatusDone(code)
    }
  }, [mine, theirs, session.status, code])

  async function choose(yes: boolean) {
    setBusy(true)
    setError(null)
    try {
      await submitFinale(code, playerId, yes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  if (mine && theirs) {
    const bothYes = mine.nextDate && theirs.nextDate
    const bothNo = !mine.nextDate && !theirs.nextDate
    let headline = 'Different answers'
    let detail = 'One yes, one no — honest either way.'
    if (bothYes) {
      headline = 'You both said yes'
      detail = 'Matching yeses. That is a good sign.'
    } else if (bothNo) {
      headline = 'You both said no'
      detail = 'Matching nos. Clear is kind.'
    }

    return (
      <div className="screen">
        <div className="screen-head">
          <p className="eyebrow">The end</p>
          <h1>Thank you for playing</h1>
          <p className="muted">{prompt}</p>
        </div>
        <div className="result-banner">
          <h2>{headline}</h2>
          <p className="muted">{detail}</p>
        </div>
        <div className="reveal-grid">
          <div className="reveal-pane">
            <div className="who">You</div>
            <p className="answer">{mine.nextDate ? 'Yes' : 'No'}</p>
          </div>
          <div className="reveal-pane">
            <div className="who">{playerName(session, partnerId)}</div>
            <p className="answer">{theirs.nextDate ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (mine && !theirs) {
    return (
      <div className="screen">
        <div className="screen-head">
          <p className="eyebrow">Finale</p>
          <h1>{prompt}</h1>
        </div>
        <WaitingState
          title="Waiting for their answer…"
          detail="You will see both answers at the same time."
        />
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Finale</p>
        <h1>{prompt}</h1>
        <p className="muted">One simple question. Answer honestly — they will answer too.</p>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="finale-choice">
        <button className="btn btn-yes" disabled={busy} onClick={() => void choose(true)}>
          Yes
        </button>
        <button className="btn btn-no" disabled={busy} onClick={() => void choose(false)}>
          No
        </button>
      </div>
    </div>
  )
}
