import type { SessionMode } from '../types'

export type { SessionMode }
export type DepthMix = { 1: number; 2: number; 3: number }

export interface SessionModeConfig {
  id: SessionMode
  label: string
  description: string
  /** Relative weights for depth 1 / 2 / 3 (need not sum to 100). Used by bank picker. */
  depthMix: DepthMix
  /** Short tone line for finale Yes/No AI suggest. */
  aiTone: string
  /**
   * Do/don't brief for complementary-question generation.
   * Stronger than a % mix — free models follow concrete constraints better.
   */
  aiComplementaryBrief: string
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
    aiComplementaryBrief: `MODE BRIEF — Casual (obey strictly):
- Prefer preferences, habits, tastes, and light opinions (food, media, weekends, small joys).
- Keep almost every question easy to answer in one breath — fun, not probing.
- Avoid: trauma, grief, romance/dating framing, life purpose, childhood wounds, money stress, politics.
- At most ONE mildly reflective question in the whole set; the rest stay light.
- Example style: "What is your go-to comfort show?" / "Beach day or cozy indoor day?"`,
    defaultFinalePrompt: 'Would you hang out again?',
  },
  {
    id: 'friends',
    label: 'Friends',
    description: 'Warm friendship vibes without getting too heavy.',
    depthMix: { 1: 50, 2: 40, 3: 10 },
    aiTone: 'warm and friendship-building — curious but not romantic',
    aiComplementaryBrief: `MODE BRIEF — Friends (obey strictly):
- Aim for shared interests, habits, values-lite, and easy personal stories.
- Mostly light–medium depth; friendship curiosity, not interrogation.
- Avoid dating/romance framing, "would you date", chemistry, or flirtatious angles.
- Avoid heavy trauma or therapy-style questions; keep things warm and low-pressure.
- Example style: "What kind of friend hangout recharges you?" / "What hobby do you wish friends asked about more?"`,
    defaultFinalePrompt: 'Want to keep hanging out?',
  },
  {
    id: 'besties',
    label: 'Besties',
    description: 'Playful with room for a few personal beats.',
    depthMix: { 1: 30, 2: 45, 3: 25 },
    aiTone: 'playful and a bit personal — like catching up with a close friend',
    aiComplementaryBrief: `MODE BRIEF — Besties (obey strictly):
- Playful, close-friend energy: inside jokes energy, quirks, loyalty, personal-but-fun beats.
- Mix light fun with a few more personal questions — still answerable without a crisis dump.
- A bit of vulnerability is OK; heavy trauma, grief deep-dives, or therapy-speak are not.
- Avoid romantic/dating framing unless they already wrote that themselves.
- Example style: "What is a tiny habit of yours that friends tease you for?" / "When do you know someone is really 'your people'?"`,
    defaultFinalePrompt: 'Besties material?',
  },
  {
    id: 'dating',
    label: 'Dating',
    description: 'Classic early-date mix of fun and depth.',
    depthMix: { 1: 30, 2: 40, 3: 30 },
    aiTone: 'warm, specific, and suitable for a first or early date',
    aiComplementaryBrief: `MODE BRIEF — Dating (obey strictly):
- Warm early-date curiosity: character, tastes, how they spend time, what they care about.
- Balance light and medium with some deeper-but-safe reflective questions.
- Be specific and inviting — not an interrogation or a job interview.
- Avoid trauma mining, marriage pressure, or "test" questions about exes/red flags.
- Example style: "What does a perfect lazy Sunday look like for you?" / "What is something small that always makes you feel cared for?"`,
    defaultFinalePrompt: 'Next date?',
  },
  {
    id: 'deep',
    label: 'Deep',
    description: 'More reflective — for when you both want substance.',
    depthMix: { 1: 15, 2: 35, 3: 50 },
    aiTone: 'reflective and thoughtful — invite honest, meaningful answers',
    aiComplementaryBrief: `MODE BRIEF — Deep (obey strictly):
- Lean reflective and meaningful: values, growth, belonging, what matters over time.
- Still specific and answerable in a few sentences — not vague philosophy essays.
- Prefer honest, thoughtful prompts over therapy-speak or clinical framing.
- Avoid shock questions, trauma traps, or anything that demands a crisis story.
- Keep a few lighter anchors so the set is not relentlessly heavy.
- Example style: "What belief of yours has changed the most in recent years?" / "When do you feel most like yourself with other people?"`,
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
