import { useState } from 'react'
import { isFirebaseConfigured } from '../firebase'
import { generateFinalePrompt, isAiConfigured } from '../lib/aiQuestions'
import { createSession, joinSession } from '../lib/sessionApi'
import { saveIdentity } from '../lib/identity'
import {
  clampQuestionsPerPerson,
  DEFAULT_QUESTIONS_PER_PERSON,
  MAX_QUESTIONS_PER_PERSON,
  MIN_QUESTIONS_PER_PERSON,
} from '../lib/questionCount'
import {
  DEFAULT_SESSION_MODE,
  getSessionMode,
  MAX_FINALE_PROMPT_LENGTH,
  normalizeFinalePrompt,
  SESSION_MODES,
  type SessionMode,
} from '../lib/sessionModes'

interface Props {
  onEntered: () => void
}

export function Home({ onEntered }: Props) {
  const [view, setView] = useState<'home' | 'create' | 'join'>('home')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [questionsPerPerson, setQuestionsPerPerson] = useState(
    DEFAULT_QUESTIONS_PER_PERSON,
  )
  const [sessionMode, setSessionMode] = useState<SessionMode>(DEFAULT_SESSION_MODE)
  const [finalePrompt, setFinalePrompt] = useState(
    () => getSessionMode(DEFAULT_SESSION_MODE).defaultFinalePrompt,
  )
  const [finaleCustomized, setFinaleCustomized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestHint, setSuggestHint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const configured = isFirebaseConfigured()
  const aiReady = isAiConfigured()

  function pickMode(next: SessionMode) {
    setSessionMode(next)
    if (!finaleCustomized) {
      setFinalePrompt(getSessionMode(next).defaultFinalePrompt)
    }
    setSuggestHint(null)
  }

  async function handleSuggestFinale() {
    setSuggesting(true)
    setSuggestHint(null)
    setError(null)
    try {
      const suggested = await generateFinalePrompt(sessionMode)
      if (!suggested) {
        setSuggestHint('Could not suggest right now — using the mode default.')
        if (!finaleCustomized) {
          setFinalePrompt(getSessionMode(sessionMode).defaultFinalePrompt)
        }
        return
      }
      setFinalePrompt(suggested)
      setFinaleCustomized(true)
      setSuggestHint('Suggestion filled in — edit anytime.')
    } finally {
      setSuggesting(false)
    }
  }

  async function handleCreate() {
    if (!configured) return
    setBusy(true)
    setError(null)
    try {
      const n = clampQuestionsPerPerson(questionsPerPerson)
      const prompt = normalizeFinalePrompt(finalePrompt, sessionMode)
      const result = await createSession(name, n, {
        mode: sessionMode,
        finalePrompt: prompt,
      })
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

  if (view === 'create') {
    const modeBlurb = getSessionMode(sessionMode).description
    return (
      <div className="screen">
        <div className="screen-head">
          <p className="eyebrow">New session</p>
          <h1>Create a room</h1>
          <p className="muted">Pick a vibe, set the finale question, then share your code.</p>
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
          <div className="field">
            <span className="field-label" id="mode-label">
              Mode
            </span>
            <div className="mode-picker" role="radiogroup" aria-labelledby="mode-label">
              {SESSION_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={sessionMode === m.id}
                  className={`mode-chip${sessionMode === m.id ? ' is-selected' : ''}`}
                  onClick={() => pickMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginTop: '0.45rem', fontSize: '0.9rem' }}>
              {modeBlurb}
            </p>
          </div>
          <div className="field">
            <label htmlFor="finale-prompt">Finale question (Yes / No)</label>
            <input
              id="finale-prompt"
              value={finalePrompt}
              onChange={(e) => {
                setFinalePrompt(e.target.value)
                setFinaleCustomized(true)
                setSuggestHint(null)
              }}
              placeholder={getSessionMode(sessionMode).defaultFinalePrompt}
              maxLength={MAX_FINALE_PROMPT_LENGTH}
            />
            <div className="finale-prompt-actions">
              <button
                type="button"
                className="btn btn-secondary btn-compact"
                disabled={suggesting || !aiReady || busy}
                onClick={() => void handleSuggestFinale()}
              >
                {suggesting ? 'Suggesting…' : 'Suggest with AI'}
              </button>
              {!aiReady ? (
                <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                  AI suggest needs OpenRouter configured.
                </p>
              ) : null}
            </div>
            {suggestHint ? (
              <p className="muted" style={{ marginTop: '0.45rem', fontSize: '0.9rem' }}>
                {suggestHint}
              </p>
            ) : null}
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={busy || !configured || !finalePrompt.trim()}
            onClick={() => void handleCreate()}
          >
            {busy ? 'Creating…' : 'Create & get code'}
          </button>
          <button className="btn btn-ghost" onClick={() => setView('home')}>
            Back
          </button>
        </div>
      </div>
    )
  }

  if (view === 'join') {
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
            onClick={() => void handleJoin()}
          >
            {busy ? 'Joining…' : 'Join session'}
          </button>
          <button className="btn btn-ghost" onClick={() => setView('home')}>
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
          onClick={() => setView('create')}
        >
          Create a session
        </button>
        <button
          className="btn btn-secondary"
          disabled={!configured}
          onClick={() => setView('join')}
        >
          Join with a code
        </button>
      </div>
    </div>
  )
}
