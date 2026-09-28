import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // D: is a network share (\\Server-pc\dssa); native fs.watch fails over SMB
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.netlify/**', '**/Graphics/**'],
    },
  },
})
