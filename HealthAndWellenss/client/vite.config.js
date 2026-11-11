import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Dev me /api wali saari requests backend (port 5000) pe forward hoti hain,
// isliye frontend me pura URL likhne ki zarurat nahi aur CORS issue bhi nahi aata
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MUI + React milkar main chunk ~500 kB (gzip ~150 kB) — admin charts alag lazy chunk me hain
  build: { chunkSizeWarningLimit: 600 },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
