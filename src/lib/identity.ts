import type { LocalIdentity } from '../types'

const KEY = 'gtk_identity'

export function loadIdentity(): LocalIdentity | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as LocalIdentity
  } catch {
    return null
  }
}

export function saveIdentity(identity: LocalIdentity): void {
  sessionStorage.setItem(KEY, JSON.stringify(identity))
}

export function clearIdentity(): void {
  sessionStorage.removeItem(KEY)
}
