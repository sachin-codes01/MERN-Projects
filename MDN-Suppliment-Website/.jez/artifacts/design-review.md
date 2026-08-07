# Design Review: MDN — My Daily Nutrition

**Date**: 2026-08-07
**URL**: http://localhost:5173 (local dev)
**Routes covered**: `/`, `/products`, `/products/:slug`, `/cart`, `/support`, `/blogs`
**Viewports**: 1440×900 desktop, 375×812 mobile
**Themes**: light + dark

---

## Method — and its one big limitation

**Screenshots were not available.** The Browser pane would not composite frames for
the entire session, so `computer{action:"screenshot"}` failed every time. This review
therefore contains **no screenshots**, and nothing in it rests on me having *looked*
at the page.

What I did instead was **measure** — injecting instrumentation into the live page to
compute WCAG contrast ratios against each element's true effective background, tap
target geometry, radius/shadow/type distributions, and horizontal overflow. For the
categories that dominate this checklist (contrast, component consistency, spacing
scale, touch targets) measurement is stronger evidence than eyeballing a screenshot.

For the categories it cannot reach — does the composition actually *look* balanced,
is the hierarchy right, does the type feel premium — **this review has nothing to say
and someone needs to look.** See "Not covered" at the end.

### One methodological trap worth recording

My first dark-mode pass reported 165 failures including ratios of **1.06:1** — text
apparently invisible. That was wrong, and I nearly reported it as the headline finding.

Because the pane was not compositing, **CSS transitions never advanced**. Any element
carrying `transition-colors` was frozen at its pre-theme-change colour while its
background had already updated, so I was measuring light-mode ink against a dark-mode
ground. Confirmed by injecting a fresh probe element (correct colour) next to a
transitioned one (stale colour).

Every number below was re-measured with `transition: none !important` forced and the
theme set via `localStorage` **before** load.

---

## Overall Impression

Structurally strong and genuinely well-built — a real type system (Didot/Jost/Inter),
a token architecture where dark mode is a pure remap, and disciplined elevation
(only two shadow levels in use across the whole page). The visual identity is
specific and not generic.

The defects were almost entirely in **colour values**, not in design decisions: the
palette was chosen for how it looked on the reference posters and never checked for
legibility. That produced 288 failing text nodes across the two themes, concentrated
in three tokens. The other systemic gap was **touch ergonomics** — the design was
laid out for a mouse.

---

## Findings

### High

- **Invisible label bar in dark mode** at `CategoryMoves` — the "Shop by Collection"
  card labels used `bg-mdn-ink` with white text. `--ink` is the *ink* role: near-black
  in light mode but near-**white** in dark, because its job is to be readable on the
  page ground. Used as a *fill* it inverted along with the text on it → white on
  near-white, measured **1.15:1**. → Switched to `bg-mdn-green-dark`, a true surface
  token that stays deep forest in both themes (and matches the footer).

- **Focus indicator invisible on the footer and on every primary button** — the global
  `:focus-visible` ring was drawn in `--green-primary`. Measured **1.2:1 against the
  deep-green footer** and **1.0:1 against green buttons** — i.e. for a keyboard user
  the focus indicator disappeared across the entire footer and every CTA on the site.
  No single colour clears 3:1 against cream, sand, deep green *and* a green fill.
  → Replaced with a two-tone ring: an orange outer ring (reads against the page) plus
  an inverted-cream inner halo (reads against saturated fills). At least one edge
  always contrasts. Verified on real keyboard Tab, not programmatic focus.

- **`--ink-muted` failed AA site-wide** (light) — at `#8a8076` it measured 3.56:1 on
  the page ground and 3.25:1 on sand bands, under the 4.5:1 floor. It is the most
  widely used token on the site (eyebrows, folio numerals, captions, star counts,
  struck-through MRP, footer meta) and was responsible for the majority of light-mode
  failures on its own. → Deepened to `#6e645a`; dark counterpart lightened to match.

- **Accent orange failed AA on prices and discount badges** — one `#dd6b14` served both
  display headings and body-size text. At body size it measured **3.34:1**, and the
  `Save X%` pill and footer copyright bar measured **3.39:1** with white text.
  Prices are the most commercially important text on the page. → Split into
  `--orange-accent` (display sizes ≥24px, nudged deeper to clear 3:1 on sand too) and
  a new `--orange-ink` (#a8480a) for anything under 24px. Fills darkened so white
  text on them clears AA.

- **Every filled button failed AA in dark mode** — `.btn-primary`, ProductCard's
  "Add to Cart", and the footer copyright bar hardcoded `#fff` / `text-white`. In
  dark mode the green and orange fills *lighten* (so they stay visible against a dark
  page), at which point white on them drops to 2.8–3.9:1. → Added `--on-primary` and
  `--badge-ink`, which invert with the theme, and pointed the call sites at them.

- **Cart button was a 20×20px tap target on mobile** — the smallest control on the site
  and one of the most used. The hamburger was 34×34. Carousel dots were 8px tall
  across three separate implementations. → Added a `.tap-44` utility that expands the
  *hit region* to 44×44 via a transparent pseudo-element without changing the mark's
  visual size. Applied to cart, hamburger, all three dot implementations, footer
  socials, and the Story "Read the full story" link.

- **Search input triggered iOS zoom-on-focus** — rendered at 14px. iOS Safari zooms the
  viewport whenever a focused input is under 16px and does **not** zoom back out on
  blur, leaving the page stuck mid-scale with the layout offset. → `.input-field` now
  pins `font-size: 16px` so every input on the site inherits the guarantee, and the
  `text-sm` override was dropped from `SearchSuggest`.

### Medium

- **Footer info ticker broke in dark mode** — it was the single colour in an otherwise
  permanently-dark footer chrome (everything else is literal hex: `#fdf8f1` type,
  `#b9c2a4` links, `#5c6a4a` rules) that used a theme-aware token, `bg-mdn-green`.
  Since that token lightens in dark mode, the cream type on it fell to 3.67:1.
  → Pinned to `#33431e`, the light-mode value, matching the rest of the footer.

- **Dark-mode `--green-primary` was marginal in both directions** — 4.48:1 as text on
  the page *and* 4.48:1 as a fill under cream trust-strip type. → Lightened one step;
  fixes "Show More", "Know More", "Login with Google", "Add to Cart" and the trust
  strip in a single token change.

- **`--mdn-gray` (legacy muted token) at 4.33:1** — used across pages not yet
  redesigned; it duplicated `--ink-muted`'s role at a different value. → Aligned to
  the same value so the two cannot drift.

- **Undersized secondary controls on mobile** — filter chips 30px, "Add to Cart" 36px,
  mobile drawer rows 40px, footer links 21px. → Chips to 39px, Add to Cart to 44px,
  drawer rows to 44px, footer links to 34px. Footer links deliberately stop short of
  44px: a full 44 per row roughly doubles the footer's height on a phone, which is the
  wrong trade for a secondary link list. 34px still clears WCAG 2.5.8 AA (24px).

- **Inconsistent eyebrow treatment** — `WhyChooseMDN` was the only section introducing
  itself with a coloured label (`text-mdn-green`) rather than the shared `.eyebrow`
  class, so it read as a different kind of element. It also measured 3.31:1 in dark
  mode. → Switched to `.eyebrow`.

### Low

- **Two pill-radius tokens coexist** — `9999px` (43 elements, Tailwind's `rounded-full`)
  and `999px` (23 elements, `--radius-pill`). Visually identical; a token-hygiene
  issue only. Not changed.
- **Small-end type scale is noisy** — 10/11/12/13px all in active use. Defensible given
  the density of commerce metadata, but 10 and 11 could likely collapse into one step.
  Not changed — needs a visual judgement I could not make.
- **MUI Switch reports a 39×13 hidden input** in tap-target scans. False positive; the
  switch's own touch area is larger. No action.
- **Filter chips land at 39px, not 44px.** Accepted: comfortably passes WCAG 2.5.8 AA,
  and pushing to 44 makes a chip read as a button.

---

## Verification

| Measure | Before | After |
|---|---|---|
| Light-mode contrast failures (home) | 123 nodes / 19 patterns | **0** |
| Dark-mode contrast failures (home) | 165 nodes / 20 patterns | **0** |
| Contrast failures — `/products`, `/products/:slug`, `/cart`, `/support`, `/blogs` | — | **0** |
| Mobile targets under 44px | 67 (16 patterns) | 23 (4 patterns) |
| Mobile targets under 40px | — | 23 → all reviewed & accepted |
| Inputs under 16px (iOS zoom) | 2 | **0** |
| Focus ring: surfaces where it is visible | 3 of 6 | **6 of 6** |
| Horizontal overflow @375px & @1440px | none | none |
| `npm run build` | pass | pass |
| `npm run lint` | 10 pre-existing warnings | same 10, none new |

---

## What Looks Good (preserve this)

- **The token architecture.** Every colour is an RGB triplet feeding
  `rgb(var(--x) / <alpha-value>)`, so dark mode is one override block rather than a
  second styling pass. This is precisely why 288 contrast failures were fixable by
  editing ~8 values instead of ~290 call sites. Do not let anyone reintroduce literal
  hex at call sites.
- **Shadow discipline.** Only two elevation levels in use across the entire home page.
  Most dev-built UIs have a different shadow on every component.
- **The synthetic-bold guard.** `font-display` resolves to "Didot Title", which ships a
  single 400 weight — a bold utility on it makes the browser smear the outline and
  destroy the thick/thin contrast a didone exists for. The guard in `index.css`
  prevents that class of mistake globally.
- **No horizontal overflow at any tested width**, despite several full-bleed `w-screen`
  bands. The `overflow-x: clip` (not `hidden`) choice is correct and load-bearing —
  `hidden` would silently break every `position: sticky` descendant.

---

## Top 3 Fixes (all applied)

1. **Two-tone focus ring** — the only finding that made the site unusable for a whole
   class of user rather than merely unpolished.
2. **Split the accent orange, deepen `--ink-muted`** — one token edit each, and
   together they cleared the large majority of 288 contrast failures.
3. **`.tap-44` hit-region utility + the 16px input floor** — turned a mouse-shaped
   layout into a touch-usable one without changing how anything looks.

---

## Not covered — needs human eyes

Everything below is in the review checklist and **was not assessed**, because it
requires seeing the rendered page and screenshots were unavailable:

- Visual hierarchy / the squint test
- Whether negative space reads as intentional or accidental
- Optical alignment and vertical rhythm as *perceived* (measured spacing is
  consistent; whether it *looks* right is a different question)
- Image cropping quality and whether the stretched product shots
  (`object-fill`, retained at your request) look acceptable in practice
- Tablet (768px) composition — measured for overflow only, not judged
- Hover/transition *feel* (durations are consistent in code; smoothness unverified —
  the pane never composited a frame)
- Loading and skeleton states in motion

I'd treat this review as **complete on measurable quality and silent on
compositional quality.**
