# Shree Radhey Shyam Health & Wellness Centre (MERN)

Customer website + staff/admin panel. React (Vite) + Tailwind CSS + Material UI on the front, Express + MongoDB on the back.

## Run locally

1. Start MongoDB (Compass → `mongodb://127.0.0.1:27017`, database **health_wellness**).
2. Backend
   ```bash
   cd server
   npm install
   npm run seed        # therapies, sample offers, first admin (login from server/.env)
   npm run seed:demo   # optional: 5 demo customers with visits (only if DB has no customers)
   npm run dev         # http://localhost:5000
   ```
3. Frontend (new terminal)
   ```bash
   cd client
   npm install
   npm run dev         # http://localhost:5173
   ```

Staff panel: http://localhost:5173/admin/login (admin email/password are in `server/.env` — change the password in Settings → My Account).

**OTP:** `OTP_DEV_MODE=true` in `server/.env` shows the OTP on screen and in the server console. For real SMS, plug a provider (MSG91 / Fast2SMS / Twilio) into `server/src/utils/sms.js` and set `OTP_DEV_MODE=false`.

## Customer flow

Welcome → New Customer (Personal → OTP → Wellness → Consent) → **Success with unique ID + QR** → Home dashboard → Therapies → Book (date, slot, offer) → Confirmation (+ Add to Calendar) → Appointments / Visit history → Rate visit → Follow-ups & reminders → Loyalty & offers → Profile (edit, consent, QR wallet card).

Returning customers log in with mobile + OTP. The QR links to `/scan/<ID>`: logged-in staff see the full profile, anyone else only sees name + ID.

## Staff & admin panel

| Page | Staff | Admin |
| --- | --- | --- |
| Dashboard (stats, growth, popularity, today's schedule) | ✓ | ✓ |
| Customers (search, profile, notes, book, call/WhatsApp) | ✓ | ✓ + deactivate |
| Appointment calendar (day/week, add, complete, cancel, no-show) | ✓ | ✓ |
| Therapies | view | add / edit / hide / delete |
| Follow-ups (WhatsApp link, mark sent) | ✓ | ✓ |
| Feedback | view | + testimonial toggle |
| Loyalty & offers | view | create / edit / delete |
| Reports (date range, charts, CSV export) | – | ✓ |
| Settings: centre info, time slots, slot capacity, booking window, loyalty rules, staff accounts | password only | ✓ |

## User-friendly extras

- Toast popups for every action, confirmation dialogs before cancel/delete/logout
- Notification bell (customer + staff) with unread count, polled every minute, popup on new items
- Automatic reminders: "appointment today/tomorrow" and due follow-ups (job runs every 30 min)
- Inline form validation (on blur + on submit) mirrored by server validation
- Registration draft survives a page refresh; OTP auto-submits, supports paste, 30s resend timer
- Double-click safe: buttons lock while saving, server uses atomic updates and unique indexes

## Folder structure

```
client/src/
  api/            client.js (fetch + token), index.js (all endpoints by name)
  context/        Auth (customer + staff), Feedback (toast + confirm), Settings
  components/
    brand/        Logo, LeafDecor
    common/       QR card, OTP input/step, notification bell, slot picker, guards...
    layout/       AuthShell, CustomerLayout (navbar + bottom tabs), AdminLayout (sidebar)
    admin/        Booking/Reminder dialogs, appointment actions, stat cards
  pages/          Welcome, Login, Scan, register/*, customer/*, admin/*
  utils/          format (dates, ₹), validators, downloads (.ics, QR card, CSV)
  theme.js        MUI theme   ·   index.css  Tailwind theme colours

server/src/
  config/         db.js, constants.js (defaults for settings)
  models/         Customer, Therapy, Appointment, Reminder, Feedback, Offer, Staff, Notification, Setting, Otp, Counter
  controllers/    auth, customer, therapy, appointment, engagement, staff, admin/*
  services/       booking (slots, capacity, offers), settings (cached), notifications
  jobs/           reminderJob.js
  routes/         index.js (public + customer), adminRoutes.js (staff/admin)
  middleware/     auth (protectCustomer / protectStaff / adminOnly), rate limits, errors
  seed/           seed.js, seedDemo.js
```

## Adding something new (example: Blog)

1. `server/src/models/Blog.js` → `controllers/blogController.js` → add routes in `routes/index.js` (public) and `routes/adminRoutes.js` (admin CRUD).
2. `client/src/api/index.js` → add `blogs: () => request('/blogs')`.
3. `client/src/pages/customer/Blog.jsx` → add `<Route>` in `App.jsx` and a link in `CustomerLayout.jsx`.
4. Admin page in `pages/admin/` + a `MENU` entry in `AdminLayout.jsx`.

Brand colours: `client/src/index.css` (`@theme`) and `client/src/theme.js`. Replace `client/public/logo.svg` with your real logo; add therapy photos from Admin → Therapies → Edit → Photo URL.

## Therapy images

Admin: Therapies -> Add/Edit -> Therapy images. Upload a card cover and gallery photos, or paste image URLs. Four gallery slots are available initially; up to 12 gallery images can be saved. Existing cover-only therapies remain editable. Gallery uploads automatically set a cover when one has not been chosen. JPEG, PNG and WebP uploads are limited to 5 MB per file.

Uploaded files are stored in server/uploads/therapies and served at /api/media. Keep this directory on persistent storage and include it in backups when deploying; it is excluded from Git. Removing a gallery entry unlinks the image from that therapy; original uploaded files are retained.

Integration check (uses an isolated temporary MongoDB database): run node --test src/tests/therapyImages.test.js from server.
