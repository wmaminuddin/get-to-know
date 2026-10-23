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
 */
const commitCount = Number(git('git rev-list --count HEAD')) || 1
const patch = Math.max(0, commitCount - 1)
const appVersion = `1.0.${patch}`

// For GitHub Pages project sites, set base to '/<repo-name>/' in .env (VITE_BASE)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
})
