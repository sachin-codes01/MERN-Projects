# Input, form, button and API audit — MDN

Audit taken before any fix. Every row is fixed in the commits that follow;
the two open choices are listed under "Decisions for you" at the end.

## Server — routes that accept input

| Location | Input | Current validation | Problem | Fix |
|---|---|---|---|---|
| `server.js` | all bodies | `express.json({ limit: "15mb" })` | 15 MB JSON on every route: easy memory/DoS lever | 10 kb default, 1 mb for `/api/admin`, 200 kb for the Razorpay webhook |
| `server.js` | headers | none | no `helmet`, no `trust proxy` (Render) | `helmet()`, `trust proxy` = 1 |
| `server.js` | CORS | any `localhost` port + Vercel | rejected origins become **500** with the raw error; LAN phone testing blocked | origins from `CLIENT_ORIGINS` env + Vercel; localhost/LAN only outside production; rejection = 403 |
| `server.js` | errors | handler returns `err.message` | Mongo/stack text leaks to clients on 500s | one error format `{ success, message, errors[] }`; 500 details hidden in production; multer/JSON/Cast errors → 400 |
| all routes | body/query | none | NoSQL operators (`{"$gt": ""}`) and dotted keys pass straight to Mongo | `rejectMongoOperators` middleware (Express-5-safe) on body, query, params |
| all `:id` routes | params | none | bad id → Mongoose CastError → **500** | `objectId` param validation → 400 |
| `POST /auth/google`, `/auth/refresh` | `credential`, `refreshToken` | presence only | no rate limit; non-string accepted | zod (string, max length) + rate limit |
| `POST /cart/items` | `productId, sizeId, flavorId, quantity` | none | `quantity` can be negative, decimal or a **string** (`"5"` → string concat in the stock check); ids unchecked | zod: ObjectIds, integer 1–10 |
| `PUT /cart/items/:itemId` | `quantity` | `<= 0` removes | decimals/huge numbers/strings accepted | zod: integer 0–10 (0 removes) |
| `POST /cart/coupon` | `code` | presence | `code.toUpperCase` crashes on non-string; no rate limit (code brute force) | zod `A–Z0–9` 3–20 + rate limit |
| `POST /orders/create-razorpay-order` | `shippingAddress, saveAddress, addressId` | presence of 6 fields | no format checks; unknown keys kept; label unbounded | zod address rules (name, phone, pincode, lines, city/state) + rate limit. Prices already recomputed server-side ✔ |
| `POST /orders/verify-payment` | Razorpay ids + signature | presence + HMAC ✔ | non-string values; no rate limit | zod strings + rate limit (HMAC, amount check and idempotent lock kept as is ✔) |
| `PUT /orders/:id/cancel` | `reason` | none | unbounded free text | zod 3–300 chars, HTML stripped |
| `GET /orders/:id` | `:id` | owner filter ✔ | bad id → 500 | ObjectId check |
| `POST /users/me/addresses`, `PUT …/:addressId` | address | **none — `req.body` pushed / `Object.assign`ed** | mass assignment of any field, no format checks | zod whitelist (strict) + rules; HTML stripped |
| `DELETE /users/me/addresses/:addressId` | `:addressId` | none | — | ObjectId check |
| `POST /products/:id/reviews` | `rating, comment, images` | schema `min/max` on rating only | comment unbounded, `images` arbitrary strings, no rate limit, HTML not stripped | zod: integer 1–5, comment 10–1000 (optional), images dropped from customer input; rate limit |
| `GET /products`, `/products/suggest` | query | regex escaped ✔ | `limit` unbounded (`limit=100000`), filters accept arrays | zod query: page/limit capped (≤100), search ≤100 chars |
| `POST /enquiries` | contact form | schema phone regex, message maxlength 2000 | names unbounded, message min length missing, no rate limit | zod: names 2–50 letters, message 10–1000, subject enum; rate limit 5/hour |
| `PUT /enquiries/:id/channel` | `channel` | schema enum | — | zod enum + ObjectId |
| `POST /admin/upload` | image file | Cloudinary `allowed_formats`, 5 MB | no MIME check before upload, file count unbounded | multer `fileFilter` (jpeg/png/webp mimetype), 1 file, 5 MB (decision) |
| `POST/PUT /admin/products` | product | **`Product.create(req.body)` / `findByIdAndUpdate(req.body)`** | mass assignment (`reviews`, `ratingsAverage`, `ratingsCount` …); no price/stock rules | zod whitelist: price > 0, discount price ≤ price, stock integer ≥ 0, ratings 0–5, required text |
| `POST/PUT /admin/categories` | category | **`Category.create(req.body)`** | mass assignment | zod whitelist |
| `POST /admin/flavors` | `name, image` | presence, regex escaped ✔ | non-string crash | zod |
| `POST/PUT /admin/coupons` | coupon | **`Coupon.create(req.body)`** | mass assignment; % above 100, negative values | zod: code rules, percentage 1–100, flat > 0, caps ≥ 0 |
| `PUT /admin/orders/:id/status` | status form | none | any status string; shipped without tracking; delivered before order date | zod enum + required fields per status + date rules |
| `GET /admin/orders`, `/admin/enquiries`, `/admin/products` | query | none | unbounded `limit`, `user` not an ObjectId | zod query |
| `PUT /admin/enquiries/:id/status` | `status` | schema enum | — | zod enum + ObjectId |
| admin `:id` routes (users, coupons, orders, products …) | `:id` | none | bad id → 500 | ObjectId check |
| Rate limits | — | none anywhere | brute force / spam | auth, refresh, contact, reviews, coupon apply, payment routes |
| Models | — | partial | no `maxlength`, `trim`, `match` on most text | constraints on User addresses, Order, Coupon, Review, Category, Product sizes |

## Client — forms and fields

| Location | Field | Current validation | Problem | Fix |
|---|---|---|---|---|
| Checkout | address fields | required + phone/pincode regex on submit | placeholders only (no labels), no `autoComplete`/`inputMode`/`maxLength`, no blur validation, mixed-language errors, pincode allowed leading 0 | shared `AddressFields` with labels, autocomplete, inputMode, maxLength, blur + submit validation |
| Checkout | coupon | trims | no format check, no loading state, double-click fires twice | uppercase A–Z0–9 3–20, loading + disabled |
| Checkout | Pay & Place Order | disabled while placing | can be pressed with an invalid form | disabled until form valid; already guarded while placing |
| Profile | address form | same as Checkout | same problems; delete uses `window.confirm` (Hindi text) | shared `AddressFields`; MUI confirm dialog |
| ContactForm | names, phone, message | first name + phone + message required | no length/charset rules, message unbounded, no blur validation | name 2–50 letters, message 10–1000 with counter, blur validation |
| ProductReviews | rating, comment | rating required | comment unbounded | comment optional but 10–1000 when given, counter, maxLength |
| CancelOrderModal | "Other" reason | non-empty | unbounded; buttons have no `type`; no Esc/ARIA dialog | 3–300 chars, `type="button"`, Esc closes, `role="dialog"` |
| Cart | quantity stepper | `>= 1` | rapid clicks send overlapping requests; no upper cap; a failed update replaces the **whole cart** with an error screen | per-line busy lock, cap 10 (and stock), errors as toast only |
| SearchSuggest / SearchInput | search | debounced ✔ | no `maxLength` | maxLength 100 (server escapes regex ✔) |
| AdminCoupons | coupon form | `required` on 2 fields | % > 100, negatives, bad code chars; no saving state; `window.confirm` | rules + inline errors, saving state, MUI confirm |
| AdminOrders | status form | estimated date for "confirmed" | shipped without tracking/courier; delivered date before order / in future; no saving state; admin cancel (which refunds) has no confirm | per-status required fields, date rules, saving state, MUI confirm on cancel |
| AdminProducts | product form | required size fields, duplicate SKU | price ≤ 0, discount price > price, decimal/negative stock, ratings out of 0–5, required text not checked; no saving state (double create); `window.confirm`/`prompt`; **editing a product drops size/flavour `_id`s, breaking customers' cart lines** | rules + inline messages, saving state, MUI confirm (typed-name for permanent delete), keep ids on edit |
| AdminProducts | category form | none | empty name | name 2–50 required |
| AdminUsers | block | `window.confirm` | not an MUI dialog | MUI confirm |

## Buttons

| Location | Problem | Fix |
|---|---|---|
| 31 buttons across 18 files | no `type` attribute (none sit inside a form today, so nothing submits by accident yet) | explicit `type="button"` |
| Cart qty +/−, remove | no busy state → double requests | busy lock per line |
| Coupon Apply/Remove, Admin save buttons, block/unblock, deactivate | no loading/disabled state | loading + disabled |
| `window.confirm` / `window.prompt` (6 places) | not MUI, inconsistent | shared `ConfirmDialog` (MUI) |

## Already correct (kept)

- Razorpay: HMAC checkout + webhook signature with constant-time compare; amount and currency re-checked against Razorpay; one-order-per-payment lock and unique index.
- Order totals, discounts and coupon value are recalculated on the server from the database.
- Ownership: orders, cart, addresses and enquiry channel are all filtered by `req.user._id`.
- Search regex input is escaped everywhere.
- The client never uses `dangerouslySetInnerHTML`.

## Decisions for you

- **Upload size**: the prompt suggests 2 MB. Product photos from a phone are often 3–5 MB, so the cap stays at 5 MB. Lower it in `server/middleware/upload.js` if you prefer.
- **Review comment**: the form says "(optional)". I kept it optional, but if written it must be 10–1000 characters. Making it required is a one-line change in `validators.js` (client) and `schemas.js` (server).

## Verification (bad request → response, test API on port 5055)

| Request | Response |
|---|---|
| `POST /cart/coupon {"code":{"$gt":""}}` | 400 `Request contains a forbidden key` |
| `GET /products?category[$ne]=x` | 400 `Unknown field: category[$ne]` |
| `POST /cart/items` with `{bad json` | 400 `Malformed JSON in request body` |
| `POST /enquiries` with a 20 kB body | 413 `Request body is too large` |
| `GET /products` from `Origin: https://evil.example` | 403 `Origin not allowed by CORS` |
| `GET /orders/not-an-id` | 400 `Order is not valid` |
| `POST /cart/items {"quantity":"5"}` | 400 `Quantity must be a number` |
| `POST /cart/items {"quantity":-3}` | 400 `Quantity must be at least 1` |
| `PUT /cart/items/:id {"quantity":1.5}` | 400 `Quantity must be a whole number` |
| `POST /cart/items {… "priceAtAddition":1}` | 400 `Unknown field: priceAtAddition` |
| `POST /cart/coupon {"code":"FREE100%!"}` | 400 `Coupon codes are 3-20 letters or numbers` |
| `POST /users/me/addresses` bad name/phone/line/city/pincode | 400 with one `errors[]` entry per field |
| `POST /users/me/addresses {… "role":"admin"}` | 400 `Unknown field: role` |
| `POST /orders/create-razorpay-order {… "total":1}` | 400 `Unknown field: total` |
| `POST /orders/verify-payment` signature `<script>` | 400 `Invalid signature` |
| `PUT /orders/:id/cancel` 400-char reason | 400 `Cancel reason must be at most 300 characters` |
| `POST /products/:id/reviews {"rating":6,"comment":"bad"}` | 400 `Rating must be at most 5` + comment error |
| `POST /products/:id/reviews {"images":["javascript:…"]}` | 400 `Unknown field: images` |
| `GET /products/suggest?q=` 150 chars | 400 `Search is too long` |
| `GET /products?limit=100000` | 400 `Limit must be at most 1000` |
| `GET /products/suggest?q=(.*)+[` | 200 (escaped, no regex error) |
| `POST /enquiries {"firstName":"A1","phone":"123","message":"hi"}` | 400 per-field errors |
| `POST /auth/google {}` | 400 `Google credential is required` |
| `POST /auth/refresh {"refreshToken":{"a":1}}` | 400 `Refresh token must be text` |
| `POST /admin/products` price 0, stock 2.5 | 400 `Price (MRP) must be greater than 0` + stock error |
| `PUT /admin/products/:id {"ratingsAverage":5}` | 400 `Unknown fields: ratingsAverage, ratingsCount` |
| `POST /admin/coupons` 150% | 400 `A percentage discount can't be more than 100%` |
| `PUT /admin/orders/:id/status` shipped, no tracking | 400 tracking + courier required |
| `PUT /admin/orders/:id/status {"status":"teleported"}` | 400 `Pick a valid order status` |
| `GET /admin/orders?user=abc` | 400 `User is not valid` |
| customer token on `GET /admin/users` | 403 `Admin access only` |
| 16th coupon attempt in 15 min | 429 `Too many coupon attempts…` |

Normal storefront requests (product lists with the client's real params, suggest,
product page, settings) all return 200, and all 18 existing products pass the
new admin product schema exactly as the admin form sends them.
