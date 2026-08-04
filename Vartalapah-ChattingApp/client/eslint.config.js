import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

// ==========================================================
// ESLINT CONFIG
//
// Ye file batati hai ki "galat/bekaar code" ka matlab kya hai - jaise
// use na hui variable, ya React ke hooks galat jagah use karna.
// VS Code me isi ki wajah se peeli/laal lakeerein (squiggly lines) dikhti hain
//
// `npm run lint` chalakar terminal me bhi saari warnings/errors dekh sakte ho
// ==========================================================
export default [
  // node_modules aur build output kabhi check nahi karte
  { ignores: ['dist', 'node_modules'] },

  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      // globals: browser ka matlab hai "window", "document" jaisi cheezein
      // pehle se maujood hain - inhe "undefined variable" mat samjho
      globals: { ...globals.browser, ...globals.node },
    },

    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },

    rules: {
      // ---------- BASE JS RULES ----------
      ...js.configs.recommended.rules,

      // ---------- REACT HOOKS RULES ----------
      // Sabse zaroori rules - inhi se pata chalta hai ki useEffect/useState
      // galat jagah (jaise if ke andar) to nahi laga diya, ya useEffect ki
      // dependency list adhoori to nahi hai
      ...reactHooks.configs.recommended.rules,

      // ---------- VITE FAST REFRESH ----------
      // Ek file me sirf component export ho to hi hot-reload (bina page
      // refresh kiye turant update) sahi se kaam karta hai
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ---------- UNUSED CODE ----------
      // Yahi rule "declared but never used" wali warning deta hai.
      // Function ke argument me agar kisi ka naam '_' se shuru ho (jaise
      // "_event") to use ignore kar dete hain - kabhi kabhi callback ka
      // pehla argument lena hi padta hai chahe use na karo
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  {
    // ---------- CONTEXT FILES + APP ENTRY ----------
    // React Context files hamesha teen cheezein ek saath export karte hain:
    // Context khud, use{Something}() hook, aur {Something}Provider component.
    // Har React tutorial isi tarah likhta hai - ye koi galti nahi, standard
    // pattern hai. react-refresh wala rule iske liye nahi bana (wo sirf
    // itna check karta hai ki fast-refresh/HMR thoda smooth rahe), isliye
    // sirf inhi files ke liye band kar diya.
    //
    // main.jsx bhi isi list me hai - wo app ka entry point hai, koi
    // component export hi nahi karta, isliye ye rule yahan lagu hi nahi hota
    files: ['src/context/**/*.jsx', 'src/main.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]
