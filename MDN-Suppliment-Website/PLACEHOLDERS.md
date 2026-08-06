# Placeholders & stand-in assets

Everything listed here renders correctly today but is **not final artwork**.
Each entry says where it appears, what the slot is really for, and the exact
size/ratio to export a replacement at, so swapping one in is a file drop
rather than a code change.

Anything **not** on this list is real: the ten collection posters, the product
photography under `client/public/mdn/`, the certification badges, and the MDN
logo are all final.

---

## 1. "What's Your Target?" goal cards — model photography

| | |
|---|---|
| **Where** | Home page → *What's Your Target?* |
| **Files** | `client/src/assets/Lean Muscles.png`, `Guilt-Free Gains.png`, `Wellness & Immunity.png`, `Strength & Endurance.png`, `Weight Loss.png`, `Bulking Up.png` |
| **Used by** | [`client/src/components/TargetSection.jsx`](client/src/components/TargetSection.jsx) |
| **Export at** | **1086 × 1448 px** portrait (3:4), subject to the right, transparent or clean background |

These are stock-style model shots standing in for MDN's own photography. Each
card is a solid green or tan ground with the copy on the left and the model
filling the right 44%, so a replacement needs the subject weighted to the
**right** of the frame — a centred subject ends up half-hidden behind the text
column.

---

## 2. Hero banner posters

| | |
|---|---|
| **Where** | Home page → top banner carousel |
| **Files** | `client/src/assets/mdn-discipline-whey-2400x1200.png`, `mdn-isolate-whey-2400x1200.jpg`, `mdn-maximum-results-2400x1200.jpg`, `mdn-shilajit-2400x1200.jpeg` |
| **Used by** | [`client/src/components/Hero.jsx`](client/src/components/Hero.jsx) |
| **Export at** | **2400 × 1200 px** desktop + **900 × 1125 px** mobile (both are already wired via `<picture>`) |

Only **`mdn-isolate-whey`** is colour-matched to the site — the page background
(`--mdn-black`, `#FEF4E9`) was sampled from it, so that banner meets the page
with no visible seam. The other three do not blend:

| Banner | Its background | Reads as |
|---|---|---|
| `mdn-discipline-whey` | `#D7E3EB` | blue-grey panel |
| `mdn-maximum-results` | `#F7F7F7` | neutral white panel |
| `mdn-shilajit` | `#FAF9F5` | near-white panel |

Export replacements on the cream ground (`#FEF4E9`) and all four will sit flush.

---

## 3. Homepage copy that is not yet admin-managed

Not images, but hardcoded content the brief wants editable from the admin panel
(§9/§10). It is correct and live, but changing it currently means editing a file:

| Content | File |
|---|---|
| Testimonials + category tabs (ALL / MUSCLE / TASTE / …) | [`ReviewsSection.jsx`](client/src/components/ReviewsSection.jsx) |
| FAQ questions and answers | [`FAQ.jsx`](client/src/components/FAQ.jsx) |
| "What's Your Target?" goal names, blurbs and links | [`TargetSection.jsx`](client/src/components/TargetSection.jsx) |
| Collection names and links | [`CategoryMoves.jsx`](client/src/components/CategoryMoves.jsx) |
| Story-of-MDN milestones and stat counters | [`StorySection.jsx`](client/src/components/StorySection.jsx) |
| Footer ticker messages | [`Footer.jsx`](client/src/components/Footer.jsx) |
| Product-page trust row (100% Authentic, Lab Tested, …) | [`ProductDetail.jsx`](client/src/pages/ProductDetail.jsx) |

---

## 4. Seeded review data

Every product currently carries the **same 24 seeded reviews**, which is why
they all show `4.3 (24 Reviews)`. The rating system itself is fully dynamic —
this is database content, not a hardcoded value.

Two ways to move off it:

- Set a per-product **Display rating** in the admin panel (Star rating + Rating
  value). Leaving both blank falls back to the review average.
- Clear the seeded reviews so counts start from real customers only.

---

## 5. Not yet built (from the redesign brief)

Listed so nothing is assumed done:

- Product page **promo banner** ("The bestselling protein for a reason!") — §7.3
- Product page **discovery columns** — Freshly Launched / Crowd Favourites /
  Look What's Trending — §7.4. Needs the curated-list models first.
- Product page **testimonial carousel** — §7.5
- **Admin CRUD** for the content in section 3 above — §10
