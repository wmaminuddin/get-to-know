import type { Session } from '../types'
import {
  DEFAULT_SESSION_MODE,
  getSessionMode,
  type DepthMix,
  type SessionMode,
} from './sessionModes'

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

/**
 * Allocate `count` slots across depths using relative mix weights.
 * Guarantees the three buckets sum to `count` (empty depths allowed when count is small).
 */
export function depthTargets(
  count: number,
  mix?: DepthMix,
): Record<1 | 2 | 3, number> {
  if (count <= 0) return { 1: 0, 2: 0, 3: 0 }

  const weights = mix ?? getSessionMode(DEFAULT_SESSION_MODE).depthMix
  const w1 = Math.max(0, weights[1])
  const w2 = Math.max(0, weights[2])
  const w3 = Math.max(0, weights[3])
  const totalW = w1 + w2 + w3 || 1

  if (count === 1) {
    // Prefer the heaviest weight.
    if (w1 >= w2 && w1 >= w3) return { 1: 1, 2: 0, 3: 0 }
    if (w2 >= w3) return { 1: 0, 2: 1, 3: 0 }
    return { 1: 0, 2: 0, 3: 1 }
  }

  let d1 = Math.round((count * w1) / totalW)
  let d2 = Math.round((count * w2) / totalW)
  let d3 = Math.round((count * w3) / totalW)
  let sum = d1 + d2 + d3

  // Fix rounding drift by adjusting the largest weight bucket.
  while (sum < count) {
    if (w1 >= w2 && w1 >= w3) d1++
    else if (w2 >= w3) d2++
    else d3++
    sum++
  }
  while (sum > count) {
    if (d1 >= d2 && d1 >= d3 && d1 > 0) d1--
    else if (d2 >= d3 && d2 > 0) d2--
    else if (d3 > 0) d3--
    else if (d1 > 0) d1--
    else if (d2 > 0) d2--
    else break
    sum--
  }

  return { 1: d1, 2: d2, 3: d3 }
}

export function depthTargetsForMode(
  mode: SessionMode | null | undefined,
  count: number,
): Record<1 | 2 | 3, number> {
  return depthTargets(count, getSessionMode(mode).depthMix)
}
