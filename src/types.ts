export type SessionStatus =
  | 'lobby'
  | 'writing'
  | 'answering'
  | 'finale'
  | 'done'

export type QuestionSource = 'a' | 'b' | 'system'

export type SessionMode = 'casual' | 'friends' | 'besties' | 'dating' | 'deep'

export interface Player {
  name: string
  joinedAt: number
  questionsReady: boolean
  questions?: string[]
  isHost?: boolean
}

export interface SessionQuestion {
  id: string
  text: string
  source: QuestionSource
}

export interface Answer {
  text: string | null
  skipped: boolean
  at: number
}

export interface PlayerProgress {
  currentIndex: number
}

export interface FinaleAnswer {
  nextDate: boolean
  at: number
}

export interface Session {
  createdAt: number
  status: SessionStatus
  hostId: string
  /** How many questions each person writes (system adds the same count). */
  questionsPerPerson?: number
  /** Host-picked vibe; steers complementary depth/tone. Defaults to dating. */
  sessionMode?: SessionMode
  /** Yes/No finale prompt text shown to both players. */
  finalePrompt?: string
  players: Record<string, Player>
  questions?: SessionQuestion[]
  answers?: Record<string, Record<string, Answer>>
  progress?: Record<string, PlayerProgress>
  finale?: Record<string, FinaleAnswer>
  deckBuilt?: boolean
}

export interface LocalIdentity {
  code: string
  playerId: string
  name: string
}
