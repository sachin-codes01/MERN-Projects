import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Phone testing (same Wi-Fi): "/api" calls ko local backend pe bhejo —
    // same origin rehta hai, isliye CORS/cookies ki dikkat nahi.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
