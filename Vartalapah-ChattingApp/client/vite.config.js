import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite ka configuration - yahan React aur Tailwind ke plugins add kiye hain
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    // ---------- PATH ALIAS ----------
    // '@' ka matlab hamesha src/ folder hota hai. Isliye ab import
    // aisa likha jata hai:
    //
    //   import { BRAND } from '@/constants/theme.js'
    //
    // iski jagah:
    //
    //   import { BRAND } from '../../../constants/theme.js'
    //
    // Do asli fayde hain:
    //   1. File ko dusre folder me move karo to uske imports todte nahi -
    //      '@/...' har jagah se ek jaisa hi hai
    //   2. Padhne wale ko turant pata chalta hai ki cheez kahan se aa rahi hai
    //      ('../../..' ginna nahi padta)
    //
    // Editor me bhi ye kaam kare, iske liye jsconfig.json me yahi alias
    // dobara likha hua hai (Vite build ke liye, jsconfig editor ke liye)
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,

    // host: false -> server sirf is computer par khulta hai (http://localhost:5173)
    // true kar do to Vite "Network:" wala address bhi dikhata hai aur wahi
    // site phone/tablet se bhi khul jati hai (dono ek hi WiFi par hone chahiye)
    host: false,

    // strictPort: true bahut zaroori hai
    // Iske bina agar 5173 busy ho to Vite chupchap 5174 par chala jata hai,
    // aur phir do problem aati hain:
    //   1. CORS fail - backend sirf 5173 ko allow karta hai
    //   2. Google login fail - 5174 Client ID me registered nahi hai
    // Ab port busy hone par Vite saaf error dega, chupke se port nahi badlega
    strictPort: true,
  },

  build: {
    rollupOptions: {
      output: {
        // ---------- CHUNK SPLITTING ----------
        // Bina iske saara node_modules (React, MUI, socket.io...) ek hi
        // JS file me chala jata hai - 700kB+ ka ek bada bundle, aur build
        // "chunk 500kB se bada hai" wali yellow warning deta hai.
        //
        // Alag-alag vendor chunks banane se:
        //   1. Warning chali jati hai (har chunk chhota hai)
        //   2. App ka apna code (jo baar-baar badalta hai) MUI/React se
        //      alag rehta hai - deploy karte waqt browser sirf apna wala
        //      chunk dobara download karta hai, MUI/React wala cache se
        //      hi mil jata hai (unke version tab tak nahi badle)
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('@mui') || id.includes('@emotion')) return 'mui-vendor'
          if (
            id.includes('react-router') ||
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            // scheduler react-dom ki apni dependency hai - isse alag chunk
            // (vendor) me daalne par react-vendor <-> vendor circular ho
            // jata tha, isliye ise bhi react-vendor me hi rakha
            id.includes('/scheduler/')
          ) {
            return 'react-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
