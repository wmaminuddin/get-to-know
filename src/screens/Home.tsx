import { useState } from 'react'
import { isFirebaseConfigured } from '../firebase'
import { createSession, joinSession } from '../lib/sessionApi'
import { saveIdentity } from '../lib/identity'
import {
  clampQuestionsPerPerson,
  DEFAULT_QUESTIONS_PER_PERSON,
  MAX_QUESTIONS_PER_PERSON,
  MIN_QUESTIONS_PER_PERSON,
} from '../lib/questionCount'

interface Props {
  onEntered: () => void
}

export function Home({ onEntered }: Props) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [questionsPerPerson, setQuestionsPerPerson] = useState(
    DEFAULT_QUESTIONS_PER_PERSON,
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const configured = isFirebaseConfigured()

  async function handleCreate() {
    if (!configured) return
    setBusy(true)
    setError(null)
    try {
      const n = clampQuestionsPerPerson(questionsPerPerson)
      const result = await createSession(name, n)
      saveIdentity({ code: result.code, playerId: result.playerId, name: name.trim() || 'Player 1' })
      onEntered()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create session.')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    if (!configured) return
    setBusy(true)
    setError(null)
    try {
      const result = await joinSession(code, name)
      saveIdentity({ code: result.code, playerId: result.playerId, name: name.trim() || 'Player 2' })
      onEntered()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join session.')
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'create') {
    return (
      <div className="screen">
        <div className="screen-head">
          <p className="eyebrow">New session</p>
          <h1>Create a room</h1>
          <p className="muted">You will get a code to share with the other person.</p>
        </div>
        <div className="stack">
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
              maxLength={24}
              autoComplete="nickname"
            />
          </div>
          <div className="field">
            <label htmlFor="q-count">Questions each person writes</label>
            <input
              id="q-count"
              type="number"
              min={MIN_QUESTIONS_PER_PERSON}
              max={MAX_QUESTIONS_PER_PERSON}
              value={questionsPerPerson}
              onChange={(e) => setQuestionsPerPerson(Number(e.target.value))}
            />
            <p className="muted" style={{ marginTop: '0.45rem', fontSize: '0.9rem' }}>
              Each of you writes {clampQuestionsPerPerson(questionsPerPerson)}; the app adds{' '}
              {clampQuestionsPerPerson(questionsPerPerson)} more →{' '}
              {clampQuestionsPerPerson(questionsPerPerson) * 3} to answer together (
              {MIN_QUESTIONS_PER_PERSON}–{MAX_QUESTIONS_PER_PERSON}).
            </p>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="btn-row">
          <button className="btn btn-primary" disabled={busy || !configured} onClick={handleCreate}>
            {busy ? 'Creating…' : 'Create & get code'}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('home')}>
            Back
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="screen">
        <div className="screen-head">
          <p className="eyebrow">Join session</p>
          <h1>Enter the code</h1>
          <p className="muted">Use the six-character code from the other person.</p>
        </div>
        <div className="stack">
          <div className="field">
            <label htmlFor="code">Matching code</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AB12CD"
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect="off"
            />
          </div>
          <div className="field">
            <label htmlFor="join-name">Your name</label>
            <input
              id="join-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam"
              maxLength={24}
              autoComplete="nickname"
            />
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={busy || !configured || code.trim().length < 4}
            onClick={handleJoin}
          >
            {busy ? 'Joining…' : 'Join session'}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('home')}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="home-hero">
        <h1 className="brand">
          Get to Know <span>You</span>
        </h1>
        <p className="lede">
          Two phones. Shared questions. One honest evening — and a simple yes or no at the end.
        </p>
      </div>
      <div className="home-actions">
        {!configured ? (
          <div className="setup-box">
            Firebase is not configured yet. Copy <code>.env.example</code> to <code>.env</code>, add
            your free Firebase Realtime Database keys, then restart the dev server.
          </div>
        ) : null}
        <button
          className="btn btn-primary"
          disabled={!configured}
          onClick={() => setMode('create')}
        >
          Create a session
        </button>
        <button
          className="btn btn-secondary"
          disabled={!configured}
          onClick={() => setMode('join')}
        >
          Join with a code
        </button>
      </div>
    </div>
  )
}
