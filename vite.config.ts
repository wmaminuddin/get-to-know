import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// For GitHub Pages project sites, set base to '/<repo-name>/' in .env (VITE_BASE)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
