import type { Session } from '../types'
import { WaitingState } from '../components/WaitingState'
import { playerName } from '../lib/sessionApi'
import { getQuestionsPerPerson } from '../lib/questionCount'

interface Props {
  session: Session
  code: string
  playerId: string
}

export function Lobby({ session, code, playerId }: Props) {
  const names = Object.values(session.players ?? {}).map((p) => p.name)
  const me = session.players?.[playerId]?.name ?? 'You'
  const perPerson = getQuestionsPerPerson(session)

  return (
    <div className="screen">
      <div className="screen-head">
        <p className="eyebrow">Lobby</p>
        <h1>Share this code</h1>
        <p className="muted">Waiting for the other person to join on their phone.</p>
      </div>
      <div className="code-display" aria-label={`Session code ${code}`}>
        {code}
      </div>
      <p className="muted" style={{ textAlign: 'center' }}>
        You are <strong style={{ color: 'var(--ink)' }}>{me}</strong>
        {names.length > 1 ? (
          <>
            {' '}
            · with {playerName(session, Object.keys(session.players).find((id) => id !== playerId) ?? null)}
          </>
        ) : null}
      </p>
      <p className="muted" style={{ textAlign: 'center' }}>
        This round: {perPerson} each + {perPerson} from the app = {perPerson * 3} questions
      </p>
      <WaitingState title="Waiting for them…" detail="They should open the app and join with this code." />
    </div>
  )
}
