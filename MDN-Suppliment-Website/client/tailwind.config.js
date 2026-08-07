import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        mdn: {
          // ---- Legacy role names, new values. ----
          // These five back `bg-mdn-black`, `text-mdn-white`, etc, which
          // are used in 52 files. They read the CSS vars in index.css, so
          // re-pointing those vars re-skins every call site at once — and
          // gives dark mode for free. The names are historical; see the
          // token block in index.css for what each role actually means
          // now (black = page background, and it is cream).
          black: "rgb(var(--mdn-black) / <alpha-value>)",
          charcoal: "rgb(var(--mdn-charcoal) / <alpha-value>)",
          charcoal2: "rgb(var(--mdn-charcoal2) / <alpha-value>)",
          white: "rgb(var(--mdn-white) / <alpha-value>)",
          gray: "rgb(var(--mdn-gray) / <alpha-value>)",

          // `mdn-green` was the old bright leaf green (#22B14C) and is
          // still referenced ~250 times. Re-pointing it at the new deep
          // forest green converts every one of those to the new theme in
          // place. Where the old design used green as an ACCENT (prices,
          // discount badges, heading highlights) the correct new colour
          // is orange, not green — those sites are changed individually
          // to `mdn-orange`, since a token swap can't tell the two uses
          // apart.
          green: "rgb(var(--green-primary) / <alpha-value>)",
          "green-light": "rgb(var(--green-mid) / <alpha-value>)",
          "green-dark": "rgb(var(--green-deep) / <alpha-value>)",
          "green-soft": "rgb(var(--green-soft) / <alpha-value>)",
          "green-title": "rgb(var(--green-title) / <alpha-value>)",

          // ---- New brand tokens. Prefer these in new code. ----
          orange: "rgb(var(--orange-accent) / <alpha-value>)",
          // Accent orange for text UNDER 24px. `mdn-orange` above is the
          // display-size value and does not reach 4.5:1 on cream at body
          // sizes — see the orange block in index.css.
          "orange-ink": "rgb(var(--orange-ink) / <alpha-value>)",
          "orange-solid": "rgb(var(--orange-solid) / <alpha-value>)",
          "orange-hover": "rgb(var(--orange-hover) / <alpha-value>)",
          "orange-badge": "rgb(var(--orange-badge) / <alpha-value>)",
          "orange-soft": "rgb(var(--orange-soft) / <alpha-value>)",

          tan: "rgb(var(--tan) / <alpha-value>)",
          sand: "rgb(var(--sand) / <alpha-value>)",
          "sand-deep": "rgb(var(--sand-deep) / <alpha-value>)",
          blush: "rgb(var(--blush) / <alpha-value>)",

          // Readable foreground for text sitting ON a saturated brand
          // fill. Inverts between themes — see index.css.
          "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
          "badge-ink": "rgb(var(--badge-ink) / <alpha-value>)",

          ink: "rgb(var(--ink) / <alpha-value>)",
          "ink-body": "rgb(var(--ink-body) / <alpha-value>)",
          "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",

          border: "rgb(var(--border-soft) / <alpha-value>)",
          "border-strong": "rgb(var(--border-strong) / <alpha-value>)",

          star: "rgb(var(--star) / <alpha-value>)",
          "stock-low": "rgb(var(--stock-low) / <alpha-value>)",
          danger: "rgb(var(--danger) / <alpha-value>)",

          // `mdn-silver` was a fixed light grey used for faint borders on
          // the old dark theme. Pointed at the warm border token so those
          // usages stop reading as cold grey on cream.
          silver: "rgb(var(--border-strong) / <alpha-value>)",
        },
      },
      fontFamily: {
        // Didot Title is the titling cut — its own family, not a weight
        // of "Didot" (see the @font-face block in index.css).
        display: ['"Didot Title"', '"Didot"', "Georgia", "serif"],
        serif: ['"Didot"', "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        // Navigation chrome ONLY — navbar and footer. Deliberately not
        // used anywhere else on the site, so page content stays on
        // Inter/Didot and the two bars read as their own layer.
        nav: ["Jost", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        // The single content width every storefront section aligns to —
        // navbar, home sections, product pages and footer all share it, so
        // they line up on one edge instead of the old mix of max-w-7xl
        // (1280px), max-w-6xl (1152px) and max-w-3xl (768px), which left
        // large gutters on wide screens and a ragged left/right edge
        // between sections. Narrow reading surfaces (cart, checkout,
        // profile, admin forms) deliberately keep their own smaller caps.
        shell: "1536px",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-xl)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
        card: "var(--shadow-sm)",
        // Was a hard green ring + glow for the dark theme. Kept under the
        // same name (it is referenced in several components) but redrawn
        // as the warm, layered elevation the new design uses — a harsh
        // glow would fight the cream ground.
        "green-glow": "var(--shadow)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease)",
        brand: "var(--ease)",
        "brand-out": "var(--ease-out)",
      },
      transitionDuration: {
        DEFAULT: "240ms",
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
        "toast-shrink": {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px) rotate(-1deg)" },
          "50%": { transform: "translateY(-16px) rotate(1.5deg)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "cart-bump": {
          "0%, 100%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.28)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.5s var(--ease-out)",
        "fade-up": "fade-up 0.5s var(--ease-out) both",
        "pop": "pop 0.35s cubic-bezier(.34,1.56,.64,1)",
        "ping-slow": "ping-slow 1.6s cubic-bezier(0,0,0.2,1) infinite",
        "mdn-bounce": "mdn-bounce 1.1s cubic-bezier(.36,0,.66,-0.56) infinite",
        "underline-sweep": "underline-sweep 0.35s cubic-bezier(.34,1.56,.64,1) both",
        "float": "float 6s ease-in-out infinite",
        "marquee": "marquee 22s linear infinite",
        "cart-bump": "cart-bump 0.4s var(--ease)",
      },
    },
  },
  plugins: [
    // Touch browsers keep a tapped element's `:hover` state active until
    // the next tap elsewhere, so every `hover:` utility (card lift, nav
    // underline, image zoom, etc.) was sticking around after a tap/click
    // instead of only showing for an actual mouse hover. Redefining the
    // built-in `hover` variant to require `(hover: hover)` makes it a true
    // "mouse hover only" state everywhere it's used, with no per-component
    // changes.
    plugin(({ addVariant }) => {
      addVariant("hover", "@media (hover: hover) { &:hover }");
    }),
  ],
};
