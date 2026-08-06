# MDN – My Daily Nutrition | Resume Details

Full-stack MERN e-commerce platform for sports nutrition & supplements, with a customer
storefront and a role-based admin dashboard.

- **Live:** https://mdn-my-daily-nutrition.vercel.app/
- **Deployment:** Frontend on Vercel, Backend on Render, Database on MongoDB Atlas
- **Repo path:** `MERN-Projects/MDN-Suppliment-Website` (`/client` + `/server`)

---

## 1. Languages

- JavaScript (ES6+ / ESM on the client, CommonJS on the server)
- JSX (React)
- HTML5
- CSS3 (Tailwind utility-first over a single CSS-custom-property token layer — colour,
  radius, elevation, easing and duration — which is what lets the whole storefront
  reskin from one file and makes dark mode a token remap, not a second stylesheet)
- JSON (config, API contracts)

## 2. Frameworks & Core Stack

**MERN Stack**
- **MongoDB** (Atlas) — document database
- **Express.js 5** — REST API framework
- **React 19** — frontend UI library
- **Node.js** — server runtime

**Build / Tooling**
- **Vite 8** — dev server + production bundler (`@vitejs/plugin-react`)
- **PostCSS + Autoprefixer**
- **oxlint** — Rust-based linter
- **Nodemon** — backend hot reload
- **Git / GitHub** — version control

## 3. Frontend Libraries

| Library | Use |
|---|---|
| `react` 19 + `react-dom` | UI layer, hooks, Suspense, lazy loading |
| `react-router-dom` 7 | Client-side routing, protected & admin routes, URL search params |
| `tailwindcss` 3 | Utility-first styling over a CSS-custom-property token layer (colour, radius, elevation, easing, duration); dark mode via `class` strategy is a token remap |
| Self-hosted webfonts | Didot (display, converted OTF -> woff2, 392KB -> 167KB), Jost (navigation chrome), Inter (body & data) |
| `@mui/material` + `@mui/icons-material` | Material UI components & icon set |
| `@emotion/react`, `@emotion/styled` | CSS-in-JS engine backing MUI |
| `motion` (Framer Motion) | Scroll reveals, parallax, mask reveals, page transitions, `MotionConfig reducedMotion="user"` |
| `lenis` | Inertial / smooth scrolling engine with a single app-wide instance |
| `@react-oauth/google` | Google Sign-In button + One Tap credential flow |
| `qrcode` | Generates a WhatsApp QR code on the contact form success screen |
| Razorpay Checkout JS SDK | Loaded via CDN script for the hosted payment modal |

## 4. Backend Libraries

| Library | Use |
|---|---|
| `express` 5 | Routing, middleware pipeline, centralized error handler |
| `mongoose` 9 | ODM — schemas, validation, custom setters, subdocuments, text/compound indexes |
| `jsonwebtoken` | Access + refresh token signing and verification |
| `google-auth-library` | Server-side verification of Google ID tokens (`OAuth2Client.verifyIdToken`) |
| `razorpay` | Server SDK — creates payment orders |
| `crypto` (Node core) | HMAC-SHA256 signature verification of Razorpay payments |
| `cloudinary` | Cloud image storage & on-upload transformations |
| `multer` + `multer-storage-cloudinary` | Multipart file upload straight to Cloudinary |
| `cors` | Origin whitelisting (regex for any localhost port + production domain) |
| `dotenv` | Environment variable management |
| `body-parser`, `lodash`, `axios` | Parsing, utilities, HTTP |

## 5. Authentication & Security

- **Google OAuth 2.0 (Sign in with Google)** — passwordless. No manual registration; the
  account is created automatically on first sign-in from the verified Google profile.
- **Server-side ID-token verification** — the Google `credential` is verified against the
  Google Client ID with `google-auth-library`; `email_verified` is explicitly checked.
  Client-supplied identity is never trusted.
- **JWT session handling with a dual-token strategy:**
  - **Access token** — short-lived (15 minutes), sent as an `Authorization: Bearer` header
  - **Refresh token** — long-lived (7 days), persisted on the user document with
    `select: false` so it never leaks through normal queries
- **Silent token refresh** — a custom fetch wrapper intercepts `401`s, exchanges the refresh
  token for a fresh access token, and transparently retries the original request.
  Concurrent 401s share one in-flight refresh promise (no refresh stampede), and a
  `CustomEvent` propagates the rotated token back into React context without a page reload.
- **Server-side logout** — the stored refresh token is nulled out so it can't be replayed.
- **Account-linking logic** — an existing email-matched account is linked to the Google
  `sub` instead of creating a duplicate user.
- **Role-Based Access Control (RBAC)** — `customer` / `admin` / `superadmin` enforced by
  chained middleware (`isAuth` → `isAdmin` → `isSuperAdmin`) at the router level.
- **Route guards on the client** — `ProtectedRoute` and `AdminRoute` wrappers.
- **User blocking** — a blocked account is rejected at the auth middleware, invalidating
  every existing token immediately.
- **Payment signature verification** — HMAC-SHA256 of `order_id|payment_id` compared to
  Razorpay's signature before an order is ever created.
- **Server-authoritative pricing** — the order total is recomputed from live product data at
  verification time, so a tampered client-side price can't change what is charged.
- **CORS whitelisting** and **secrets kept entirely in `.env`** (git-ignored).

## 6. Payments — Razorpay Integration

- Two-step server flow: `POST /create-razorpay-order` → Razorpay Checkout modal →
  `POST /verify-payment`
- Payment signature verified with HMAC-SHA256 before order creation
- **Atomic, conditional stock decrement** — `findOneAndUpdate` with a
  `stock: { $gte: quantity }` guard so two buyers can't oversell the same unit
- **Rollback on failure** — any items already decremented are restored if a later line fails
- Razorpay `order_id` / `payment_id` persisted on the order for reconciliation
- Single source of truth for pricing (`utils/orderPricing.js`) shared by the cart summary,
  the Razorpay amount and the stored order — so the quoted total can never drift from the
  charged total. Includes 5% GST, ₹79 shipping, free shipping above ₹999.

## 7. Feature List — Customer Storefront

- Google one-click login / signup
- Home page with hero carousel, bestsellers, category tiles, story sections, trust badges,
  FAQ accordion, bundle offers and testimonial/review sections
- Product listing with **filtering** (category, product type, fitness goal, homepage
  section), **sorting** (price low/high, rating) and **pagination**
- **Live search with autocomplete** — a dedicated ranked-suggestion endpoint using escaped
  case-insensitive regex for partial mid-word matching, with relevance ranking
  (name-prefix > word-start > other fields)
- Product Detail Page (PDP): image gallery, independent **size** and **flavor** variant
  pickers (size holds stock/SKU/price, flavor applies a price delta), nutrition facts,
  nutrition highlight stat cards, per-product benefit strip, ingredients, directions,
  warnings, "Who is this for", sticky add-to-cart bar, promo posters
- **Guest cart** — add to cart without logging in (localStorage), then a resilient
  **per-line merge** into the server cart on login; permanently-invalid lines are dropped
  while recoverable ones are preserved for a retry
- Cart with quantity updates, line removal, and live order summary
- **Coupon system** — percentage and flat discounts with min-order value, max-discount cap
  and expiry validation
- Checkout with a **saved-address picker**, inline new-address entry, duplicate-address
  detection and optional address saving
- Order placement via Razorpay, order history, and an **order tracking timeline** with
  status history (placed → confirmed → processing → shipped → out for delivery → delivered)
- Order cancellation for eligible orders, with automatic **stock restoration**
- Profile page — account info + full CRUD address book with default address
- Product reviews & 5-star ratings with duplicate-review prevention and auto-recalculated
  rating average/count
- **Login-gated contact form** — enquiry is persisted server-side, then deep-links into a
  **pre-filled WhatsApp chat** with a generated **QR code** fallback; tracks which channel
  the visitor actually opened
- Customer support page, blog listing and blog detail pages
- **Dark / light theme toggle** with localStorage persistence
- **Per-product display rating** — admin sets the star count and numeric value, or leaves
  it blank to fall back to the average of real customer reviews; review counts are always
  the true count and never fabricated
- **Related products** carousel resolved through three rings — same product type, then
  same category, then a shuffled catalogue fill — de-duplicated, current product excluded
- Toast notification system, cart badge counter, global loading states

## 8. Feature List — Admin Dashboard

- Product management — create/edit/delete with dynamic size & flavor arrays, nutrition
  data, benefits, SEO meta fields, and client-side SKU uniqueness validation
- **Soft delete vs. permanent delete on separate routes**, so an accidental `DELETE` can
  only ever deactivate, never destroy
- **Cloudinary image uploads** via Multer with 5 MB limit, format whitelist and automatic
  resize/quality transformation
- Category management (hierarchical — supports parent categories, display ordering)
- Coupon management (create, edit, deactivate, hard delete)
- Order management — paginated/filterable list, status updates with tracking number,
  courier partner, estimated delivery and delivered dates, plus an audit trail of status
  changes
- User management — list users, view a user's orders, block/unblock
- Enquiry inbox — view and triage contact submissions (new / in progress / resolved)

## 9. Architecture & Engineering Highlights

- **RESTful API** with a clean MVC layout: `routes → controller → model`, plus
  `middleware/`, `config/` and `utils/`
- **Consistent API envelope** (`{ success, data, message }`) with a catch-all JSON 404 and a
  4-argument Express error handler, so the client never receives an HTML error page it
  can't parse
- **React Context API** for global state — Auth, Cart Badge, Toast, Theme and Site Settings
  providers (no Redux needed)
- **Code splitting** — `React.lazy` + `Suspense` for every route except the landing page,
  so the first paint ships only the home-page bundle
- **Error boundaries** keyed by route pathname — a render crash on one page shows a
  fallback instead of blanking the entire app, and navigating away recovers automatically
- **Accessibility & performance**: `prefers-reduced-motion` respected across both CSS and
  JS-driven animation; `overscroll-behavior-x` to stop horizontal carousel gestures
  triggering browser back/forward navigation; a custom Tailwind variant that makes
  `hover:` a true mouse-only state on touch devices
- **Mongoose modelling depth** — embedded subdocument arrays, custom slug setters that run
  on both create and update, a weighted text index, a singleton settings pattern, and
  regex-validated Indian phone numbers
- **Denormalization where it matters** — order line items snapshot name/price/flavor/image
  so historical orders stay accurate after a product changes
- **Custom fetch API client** (no Axios on the frontend) with centralized auth headers,
  token refresh, session expiry handling and error normalization
- **Database seed & migration scripts** (catalogue seeding, review seeding, variant
  migration) run via npm scripts
- **Fully responsive**, mobile-first UI built on a shared max-width design shell with
  custom keyframe animations and a token-based color system

## 10. One-Line Resume Bullets (ready to paste)

- Built **MDN – My Daily Nutrition**, a full-stack MERN e-commerce platform for sports
  supplements with a customer storefront and role-based admin dashboard; deployed on Vercel
  (React/Vite) and Render (Node/Express) with MongoDB Atlas.
- Implemented **passwordless Google OAuth 2.0** with server-side ID-token verification and
  a **JWT access/refresh token** scheme (15-min access, 7-day refresh) featuring silent
  token rotation, de-duplicated concurrent refreshes and server-side logout invalidation.
- Integrated **Razorpay** payments end to end with **HMAC-SHA256 signature verification**,
  server-authoritative price recalculation, atomic conditional stock decrements to prevent
  overselling, and automatic rollback on partial failure.
- Designed a **guest-to-user cart merge** that lets shoppers build a cart before logging in,
  merging line-by-line so a single invalid item can never wipe the cart.
- Built **RBAC** (customer/admin/superadmin) with chained Express middleware and matching
  React route guards, powering an admin panel for products, categories, coupons, orders,
  users and enquiries.
- Engineered a **regex-based autocomplete search** with relevance ranking after MongoDB
  text-index tokenization proved unable to match partial terms.
- Optimized frontend delivery with **route-level code splitting**, per-route error
  boundaries, Lenis smooth scrolling, Framer Motion scroll animations and full
  `prefers-reduced-motion` support.
- Implemented **Cloudinary** image uploads via Multer with automatic transformation, plus a
  soft-delete/hard-delete separation to make destructive admin actions opt-in.

---

## 11. Keyword Bank (for ATS / skills section)

`MERN` · `MongoDB` · `Mongoose` · `Express.js` · `React 19` · `Node.js` · `JavaScript (ES6+)`
· `Vite` · `Tailwind CSS` · `Design Tokens` · `Typography` · `Material UI` · `React Router` · `Context API` · `REST API`
· `JWT` · `OAuth 2.0` · `Google Sign-In` · `RBAC` · `Razorpay` · `Payment Gateway
Integration` · `HMAC-SHA256` · `Cloudinary` · `Multer` · `CORS` · `Framer Motion` · `Lenis`
· `Design Tokens` · `Code Splitting` · `Lazy Loading` · `Error Boundaries` · `Responsive
Design` · `Dark Mode` · `E-Commerce` · `Vercel` · `Render` · `MongoDB Atlas` · `Git/GitHub`
