import type { SessionMode } from '../types'

export type { SessionMode }
export type DepthMix = { 1: number; 2: number; 3: number }

export interface SessionModeConfig {
  id: SessionMode
  label: string
  description: string
  /** Relative weights for depth 1 / 2 / 3 (need not sum to 100). */
  depthMix: DepthMix
  /** Tone line injected into the complementary-question AI prompt. */
  aiTone: string
  defaultFinalePrompt: string
}

export const DEFAULT_SESSION_MODE: SessionMode = 'dating'
export const DEFAULT_FINALE_PROMPT = 'Next Date?'
export const MAX_FINALE_PROMPT_LENGTH = 120

export const SESSION_MODES: SessionModeConfig[] = [
  {
    id: 'casual',
    label: 'Casual',
    description: 'Light and low-pressure — easy icebreakers.',
    depthMix: { 1: 70, 2: 25, 3: 5 },
    aiTone: 'light, fun, and low pressure — keep things easy and playful',
    defaultFinalePrompt: 'Would you hang out again?',
  },
  {
    id: 'friends',
    label: 'Friends',
    description: 'Warm friendship vibes without getting too heavy.',
    depthMix: { 1: 50, 2: 40, 3: 10 },
    aiTone: 'warm and friendship-building — curious but not romantic',
    defaultFinalePrompt: 'Want to keep hanging out?',
  },
  {
    id: 'besties',
    label: 'Besties',
    description: 'Playful with room for a few personal beats.',
    depthMix: { 1: 30, 2: 45, 3: 25 },
    aiTone: 'playful and a bit personal — like catching up with a close friend',
    defaultFinalePrompt: 'Besties material?',
  },
  {
    id: 'dating',
    label: 'Dating',
    description: 'Classic early-date mix of fun and depth.',
    depthMix: { 1: 30, 2: 40, 3: 30 },
    aiTone: 'warm, specific, and suitable for a first or early date',
    defaultFinalePrompt: 'Next date?',
  },
  {
    id: 'deep',
    label: 'Deep',
    description: 'More reflective — for when you both want substance.',
    depthMix: { 1: 15, 2: 35, 3: 50 },
    aiTone: 'reflective and thoughtful — invite honest, meaningful answers',
    defaultFinalePrompt: 'Want to go deeper sometime?',
  },
]

const MODE_BY_ID = Object.fromEntries(
  SESSION_MODES.map((m) => [m.id, m]),
) as Record<SessionMode, SessionModeConfig>

export function isSessionMode(value: unknown): value is SessionMode {
  return (
    typeof value === 'string' &&
    (SESSION_MODES as SessionModeConfig[]).some((m) => m.id === value)
  )
}

export function getSessionMode(mode?: SessionMode | null): SessionModeConfig {
  if (mode && isSessionMode(mode)) return MODE_BY_ID[mode]
  return MODE_BY_ID[DEFAULT_SESSION_MODE]
}

export function normalizeFinalePrompt(raw: string, mode?: SessionMode | null): string {
  let text = raw.replace(/\s+/g, ' ').trim()
  if (!text) text = getSessionMode(mode).defaultFinalePrompt
  if (text.length > MAX_FINALE_PROMPT_LENGTH) {
    text = text.slice(0, MAX_FINALE_PROMPT_LENGTH).trim()
  }
  if (!text.endsWith('?')) text = `${text}?`
  return text
}

export function getFinalePrompt(
  session: { finalePrompt?: string; sessionMode?: SessionMode },
): string {
  if (session.finalePrompt?.trim()) {
    return normalizeFinalePrompt(session.finalePrompt, session.sessionMode)
  }
  if (session.sessionMode) {
    return getSessionMode(session.sessionMode).defaultFinalePrompt
  }
  return DEFAULT_FINALE_PROMPT
}
