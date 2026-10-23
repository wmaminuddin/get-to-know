import type { Session } from '../types'

export const DEFAULT_QUESTIONS_PER_PERSON = 10
export const MIN_QUESTIONS_PER_PERSON = 3
export const MAX_QUESTIONS_PER_PERSON = 15

export function clampQuestionsPerPerson(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_QUESTIONS_PER_PERSON
  return Math.min(
    MAX_QUESTIONS_PER_PERSON,
    Math.max(MIN_QUESTIONS_PER_PERSON, Math.round(n)),
  )
}

export function getQuestionsPerPerson(session: Session): number {
  return clampQuestionsPerPerson(
    session.questionsPerPerson ?? DEFAULT_QUESTIONS_PER_PERSON,
  )
}

/** Depth mix for N system questions: ~30% basic, ~40% medium, ~30% deep */
export function depthTargets(count: number): Record<1 | 2 | 3, number> {
  if (count <= 0) return { 1: 0, 2: 0, 3: 0 }
  if (count === 1) return { 1: 1, 2: 0, 3: 0 }
  if (count === 2) return { 1: 1, 2: 1, 3: 0 }
  const d1 = Math.max(1, Math.round(count * 0.3))
  const d3 = Math.max(1, Math.round(count * 0.3))
  let d2 = count - d1 - d3
  if (d2 < 1) {
    d2 = 1
    // shrink the larger of d1/d3
    if (d1 >= d3) return { 1: count - d2 - d3, 2: d2, 3: d3 }
    return { 1: d1, 2: d2, 3: count - d1 - d2 }
  }
  return { 1: d1, 2: d2, 3: d3 }
}
