/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        mdn: {
          black: "#0B0C0D",
          charcoal: "#16181A",
          charcoal2: "#1F2224",
          green: "#22B14C",
          "green-light": "#4ADE80",
          "green-dark": "#16803C",
          silver: "#C9CDD3",
          white: "#F5F7F5",
          gray: "#9AA0A6",
        },
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "green-glow": "0 0 0 1px rgba(34,177,76,0.4), 0 8px 24px -8px rgba(34,177,76,0.35)",
        card: "0 4px 16px -4px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: 0, transform: "translateX(24px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.6)", opacity: 0 },
          "60%": { transform: "scale(1.15)", opacity: 1 },
          "100%": { transform: "scale(1)" },
        },
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: 0.9 },
          "75%, 100%": { transform: "scale(1.9)", opacity: 0 },
        },
        "mdn-bounce": {
          "0%, 80%, 100%": { transform: "translateY(0) scale(1)", opacity: 1 },
          "40%": { transform: "translateY(-10px) scale(1.08)", opacity: 0.75 },
        },
        "underline-sweep": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,177,76,0.55)" },
          "50%": { boxShadow: "0 0 0 6px rgba(34,177,76,0)" },
        },
        "toast-shrink": {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.5s ease-out",
        "fade-up": "fade-up 0.5s ease-out both",
        "pop": "pop 0.35s cubic-bezier(.34,1.56,.64,1)",
        "ping-slow": "ping-slow 1.6s cubic-bezier(0,0,0.2,1) infinite",
        "mdn-bounce": "mdn-bounce 1.1s cubic-bezier(.36,0,.66,-0.56) infinite",
        "underline-sweep": "underline-sweep 0.35s cubic-bezier(.34,1.56,.64,1) both",
        "glow-pulse": "glow-pulse 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};