import { useEffect, useState, type ReactNode } from 'react'
import { clearIdentity, loadIdentity } from './lib/identity'
import { ensureWritingStatus, subscribeSession, tryBuildDeck } from './lib/sessionApi'
import type { LocalIdentity, Session } from './types'
import { Finale } from './screens/Finale'
import { Home } from './screens/Home'
import { Lobby } from './screens/Lobby'
import { PlayRound } from './screens/PlayRound'
import { WriteQuestions } from './screens/WriteQuestions'
import { WaitingState } from './components/WaitingState'

export default function App() {
  const [identity, setIdentity] = useState<LocalIdentity | null>(() => loadIdentity())
  const [session, setSession] = useState<Session | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    if (!identity) {
      setSession(null)
      setBootstrapped(true)
      return
    }
    setBootstrapped(false)
    const unsub = subscribeSession(identity.code, (s) => {
      setSession(s)
      setBootstrapped(true)
    })
    return unsub
  }, [identity])

  // Promote lobby → writing once two players are present
  useEffect(() => {
    if (!identity || !session) return
    if (session.status === 'lobby' && Object.keys(session.players ?? {}).length >= 2) {
      void ensureWritingStatus(identity.code)
    }
  }, [identity, session])

  // Host builds the deck once both are ready (avoids a race where a failed AI
  // client commits the bank while the other client's AI result is discarded).
  useEffect(() => {
    if (!identity || !session) return
    if (session.deckBuilt || session.questions?.length) return
    if (identity.playerId !== session.hostId) return
    const players = Object.values(session.players ?? {})
    if (players.length === 2 && players.every((p) => p.questionsReady)) {
      void tryBuildDeck(identity.code)
    }
  }, [identity, session])

  function handleEntered() {
    setIdentity(loadIdentity())
  }

  function handleLeave() {
    clearIdentity()
    setIdentity(null)
    setSession(null)
  }

  let body: ReactNode

  if (!identity) {
    body = <Home onEntered={handleEntered} />
  } else if (!bootstrapped) {
    body = <WaitingState title="Connecting…" />
  } else if (!session) {
    body = (
      <div className="screen">
        <div className="screen-head">
          <h1>Session not found</h1>
          <p className="muted">The room may have expired or the code is wrong.</p>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleLeave}>
            Back home
          </button>
        </div>
      </div>
    )
  } else {
    const { status } = session
    if (status === 'lobby') {
      body = <Lobby session={session} code={identity.code} playerId={identity.playerId} />
    } else if (status === 'writing') {
      body = (
        <WriteQuestions code={identity.code} playerId={identity.playerId} session={session} />
      )
    } else if (status === 'answering') {
      body = <PlayRound code={identity.code} playerId={identity.playerId} session={session} />
    } else if (status === 'finale' || status === 'done') {
      body = <Finale code={identity.code} playerId={identity.playerId} session={session} />
    } else {
      body = <WaitingState title="Loading…" />
    }
  }

  return (
    <div className="app-shell">
      {body}
      {identity && session?.status === 'done' ? (
        <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={handleLeave}>
          Start over
        </button>
      ) : null}
      <p className="app-version" title="Build version (patch bumps on each commit)">
        v{__APP_VERSION__}
      </p>
    </div>
  )
}
