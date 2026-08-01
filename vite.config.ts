import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Serves the Playwright fixture only. The library itself is built with tsc.
export default defineConfig({
  root: 'tests/fixtures',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
