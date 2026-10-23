import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

function git(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8' }).trim()
  } catch {
    return '0'
  }
}

/**
 * v1.0.0 = first commit on the branch (initial release).
 * Each later commit bumps the patch: 1.0.1, 1.0.2, …
 * CI must checkout with fetch-depth: 0 or this stays stuck at 1.0.0.
 */
const commitCount = Number(git('git rev-list --count HEAD')) || 1
const patch = Math.max(0, commitCount - 1)
const appVersion = `1.0.${patch}`
const isShallow = git('git rev-parse --is-shallow-repository') === 'true'
if (isShallow) {
  console.warn(
    `[version] shallow git clone detected (count=${commitCount}). Use fetch-depth: 0 for correct v1.0.N.`,
  )
}
console.log(`[version] v${appVersion} (${commitCount} commits)`)

// For GitHub Pages project sites, set base to '/<repo-name>/' in .env (VITE_BASE)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
})
