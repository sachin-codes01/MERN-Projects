# Vārtālāpaḥ — How This Project Works

This document explains the project in plain language. If you can read this
top to bottom, you can answer almost any interview question about it.

It is written for **you** (the person who built it), not for a user. It says
*why* things are the way they are, not just *what* they are.

---

## 1. What is this project, in one paragraph

Vārtālāpaḥ is a real-time chat web app. You sign in with Google or with a
username/email/password account, see a list of people and groups, open a
conversation, and send text, photos or short videos.
Messages appear on the other person's screen instantly — without refreshing —
because the server pushes them over a WebSocket. It works on desktop and is
built to feel like a native app on a phone browser.

**Stack:** MongoDB + Express + React + Node.js (MERN), plus Socket.IO for
real-time and Cloudinary for storing images and videos.

---

## 2. The big picture — how a message travels

This is the single most important diagram in the project. Learn this one.

```
  YOUR BROWSER                    SERVER                    THEIR BROWSER
  ───────────                     ──────                    ─────────────

  type + press Send
        │
        ▼
  useMessages.sendMessage()
        │
        ▼
  messageApi.send()  ──── HTTP POST /api/messages ────►  save to MongoDB
                                                              │
                                                              ▼
                                                     io.to(receiverId)
                                                       .emit('new-message')
                                                              │
        ◄──── HTTP response (the saved message) ──────────────┤
        │                                                     │
        ▼                                                     ▼
  add to my screen                                   ═══ WebSocket ═══►
                                                              │
                                                              ▼
                                                     useChatSocket hears
                                                     'new-message' and
                                                     adds it to their screen
```

**The key idea:** there are **two channels**, and they do different jobs.

| Channel | Used for | Direction |
|---|---|---|
| **HTTP (REST)** | Doing things — send, edit, delete, log in, upload | Browser asks, server answers |
| **WebSocket (Socket.IO)** | Being told things — new message, typing, online/offline | Server tells browser, unprompted |

Why both? HTTP cannot push. The server has no way to "call" your browser over
HTTP — your browser has to ask first. So we save with HTTP (reliable, returns
the saved record) and *notify the other person* with a WebSocket.

**Interview question you will get: "Why not do everything over the socket?"**
Because HTTP gives you a clear request/response pair with status codes and
error handling for free, and it works even if the socket has dropped. The
socket is a notification channel, not the source of truth. If the socket dies,
messages still send — the other side just sees them a bit later, on refresh.

---

## 3. Folder structure — and why each folder exists

### Client (`client/src/`)

```
src/
├── api/          Every network call lives here. Nothing else calls fetch().
├── assets/       Fonts and images that get bundled.
├── components/
│   ├── chat/     Pieces that only make sense inside the chat feature.
│   ├── home/     Pieces that only make sense on the landing page.
│   └── ui/       Generic pieces. No idea what a "message" is.
├── constants/    Numbers and strings with names, so nothing is magic.
├── context/      Data many components need: auth, socket, theme.
├── hooks/
│   ├── chat/     Reusable chat logic (loading messages, group actions...).
│   └── ui/       Reusable browser logic (long press, keyboard, back button).
├── pages/        One file per route. Mostly wiring, very little logic.
├── routes/       The route table (which URL shows which page).
├── styles/       Global CSS and shared MUI style objects.
└── utils/        Small pure functions. No state, no network.
```

**The rule that decides where a file goes:** *how many things know about it?*

- Only the chat knows about it → `components/chat/`
- Anything could use it → `components/ui/`
- It has no UI at all, just logic → `hooks/`
- It has no UI *and* no state → `utils/`

**Why `api/` is separate from `hooks/`:** the API layer knows *URLs*. The hooks
know *when to call them and what to do with the answer*. If the backend renames
`/api/messages/:id` tomorrow, exactly one file changes. Components never see a
URL at all.

**Why there is no `store/` folder:** state management here is React Context plus
local `useState`. This app has one logged-in user, one open chat and one list —
Redux would be more ceremony than benefit. An empty `store/` folder would be
worse than no folder.

**Why there is no `types/` folder:** this is JavaScript, not TypeScript. (Adding
TypeScript is the top item in "future improvements".)

### Server (`server/`)

```
server/
├── config/       Database connection and Cloudinary setup.
├── middleware/   Runs between the request and the route: auth, errors.
├── models/       Mongoose schemas — the shape of the data in MongoDB.
├── routes/       The API endpoints themselves.
├── socket/       Socket.IO setup and real-time event handlers.
├── utils/        Helpers needed by more than one route.
└── server.js     Entry point. Wires middleware + routes, starts listening.
```

**Why the route handlers are not split into a `controllers/` folder:** each route
file is one resource (`messages`, `groups`, `users`) and reads top to bottom as
a list of endpoints. Splitting each one into a thin router plus a controller
would mean jumping between two files to follow one request, for no gain at this
size. It is a normal and defensible Express layout. If a route file grows past
a point where you cannot find things in it, *that* is the moment to split.

---

## 4. Authentication — how login actually works

There are **two ways in**: Google OAuth, and a normal username + email +
password account. Both end up as the same kind of `User` document and the same
JWT-in-a-cookie session — the app does not treat them differently after login.

### 4.1 Google sign-in (the original, still the simplest path)

```
 1. User clicks "Sign in with Google"
 2. Google shows its own popup and returns a "credential" (a JWT from Google)
 3. Frontend sends that credential to POST /api/auth/google
 4. Backend calls google-auth-library to VERIFY the credential really came
    from Google and really was issued for our app
 5. Backend looks for that email in MongoDB:
       found     -> mark online
       not found -> create the user (this is the "sign up")
 6. Backend creates ITS OWN JWT and puts it in an httpOnly cookie
 7. Every later request carries that cookie automatically
```

A Google-only user has `password: null` in the database. `publicUser()` in
`utils/token.js` computes `needsPassword: !user.password` on every response, and
the frontend router (`AppRoutes.jsx`) redirects anyone with `needsPassword: true`
to `/create-password` before letting them into `/chat`.

### 4.2 Username + password signup — and the problem it had to solve

A normal "type any email you want" signup would let someone register with an
email they do not own. The fix is an emailed one-time code: the code only ever
lands in that inbox, so repeating it back is proof of ownership.

```
 1. User fills in username, email, password, confirm password (client-side
    validation only — nothing is created yet)
 2. POST /api/auth/send-otp { email, purpose: 'register' } emails a
    6-digit code (nodemailer over plain SMTP — see utils/mailer.js)
 3. User types the code -> POST /api/auth/verify-otp
    Backend HMACs the code and compares it to the stored hash. On success
    it deletes the record and returns a signed verificationToken (15 min)
 4. Frontend sends { username, email, password, confirmPassword,
    verificationToken } to POST /api/auth/register
 5. Backend re-reads the token server-side and checks
    token.email === the email the user typed
       mismatch -> reject (the form was edited after verifying)
       match    -> the email really does belong to this person
 6. Backend hashes the password with bcrypt, creates the User, logs them in
```

The verification token exists because verifying the code and creating the
account are two separate requests, with the user typing a password in between.
It is the note that carries "this email was just proven" across that gap —
exactly the job the Google credential used to do.

**Why not just use Google for this?** It worked, but it forced every signup
through a Google account. Anyone with an email address can now sign up, and the
end state is still a real bcrypt password, so they can log in with
`POST /api/auth/login` on a device where they've never touched Google.

### 4.3 Forgot password — same mechanism, used for recovery instead of signup

```
 1. User types their email (required first — this is intentional, see below)
 2. POST /api/auth/check-email confirms an account exists for it
 3. POST /api/auth/send-otp { email, purpose: 'reset' } emails a code
 4. POST /api/auth/verify-otp returns a verificationToken for that email
 5. Only now does the "set a new password" form appear
 6. POST /api/auth/reset-password re-reads the token server-side,
    hashes the new password, saves it — and does NOT log the user in.
    They're sent back to /login to prove the new password works
```

Both flows share one React component (`components/auth/EmailOtpStep.jsx`) and
the same two routes; only `purpose` differs. `purpose` is part of the stored
record *and* the token, so a signup code can never be replayed as a password
reset.

The code itself is defended four ways: 10-minute expiry, 5 wrong attempts before
it is destroyed, a 60-second per-email resend cooldown, and one live code per
(email, purpose) — sending a new one overwrites the old.

Two deliberate design choices worth explaining out loud:

- **Email first, then the code, not the other way round.** Asking for the email
  up front lets `check-email` give a specific, useful error ("no account for
  this address — create one?") before any mail is sent.
- **Any account can use this, not just Google-created ones.** The check is
  "does an account exist for this email", never "was this account created via
  Google" — `googleId` is not part of the check. A user who signed up through
  Google can still recover access by proving they own that same inbox.
  Ownership of the email is what matters, not how the account was created.

### The three questions you will definitely be asked

**"Why verify on the backend? The frontend already checked."**
Because anything the frontend sends can be faked. A person with curl can post
`{ credential: "anything" }` or `{ verificationToken: "anything" }`. Backend
verification is the only thing that makes login (or the email-ownership proof
in 4.2/4.3) real. **Never trust the client** is the rule this whole app follows.
For Google the backend checks Google's own `email_verified` claim, not just that
the token is genuine; for OTP the token is signed with `JWT_SECRET`, so a forged
one fails `jwt.verify` immediately.

**"Why is the OTP hashed with HMAC and not plain SHA-256?"**
A 6-digit code has only a million possible values. If the database leaked,
plain SHA-256 hashes could be reversed by hashing all million in seconds. HMAC
keyed with `JWT_SECRET` means the hash cannot even be computed without the
server's secret.

**"Why a cookie and not localStorage?"**
The cookie is `httpOnly`, which means JavaScript *cannot read it* — not our
code, not injected code. If someone ever managed to run a script on the page,
a token in `localStorage` would be theirs instantly; an httpOnly cookie would
not. The cookie is also `secure` (HTTPS only) and `sameSite` in production.

The cost of cookies is that they need `credentials: 'include'` on every fetch
and matching CORS settings on the server — that is why `httpClient.js` sets it
in one place, and why `server.js` sets `cors({ credentials: true })`. It also
means logins are vulnerable to CSRF unless you explicitly guard against it —
see section 4.4.

**"How do you stop someone signing up twice with the same email — once via
Google, once via password?"**
Both `/api/auth/google` and `/api/auth/register` look a user up **by email**,
never by how the account was created. If the email already exists, Google
sign-in logs into that existing account (and fills in `googleId` if it was
missing) instead of creating a new one, and password registration is rejected
outright with "an account with this email already exists". One email, one
account, no matter which door you came in through.

### 4.4 CSRF protection

Because the session cookie is `sameSite: 'none'` in production (required for
the Vercel frontend to talk to the Render backend, which are different
domains), the browser will attach it to a request from *any* site, not just
this one. Without a second check, a malicious page could trick a logged-in
user's browser into firing a request here and it would look authenticated.

The fix is the standard **double-submit cookie** pattern
(`middleware/csrf.js`): on login, the server also sets a *second*, non-`httpOnly`
cookie (`csrf_token`) that JavaScript on our own frontend can read. Every
non-GET request must echo that value back as an `X-CSRF-Token` header
(`api/httpClient.js` does this automatically). The server rejects the request
unless the header matches the cookie. A different website can make the browser
*send* the cookie, but it can never *read* its value to build a matching
header — same-origin policy blocks that.

### How a protected route stays protected

`middleware/protect.js` runs before any protected handler. It reads the cookie,
verifies the JWT, loads the user from MongoDB, and hangs it on `req.user`. If
anything fails it returns 401 and the handler never runs.

```js
router.use(protect)   // <- one line, and every route below it needs login
```

---

## 5. Real-time — how Socket.IO is wired

### Rooms

A "room" is just a label you can broadcast to. This app uses two kinds:

| Room name | Who is in it | Used for |
|---|---|---|
| `"<userId>"` | that one user, all their open tabs | private messages |
| `"group:<groupId>"` | every member of that group | group messages |

When a socket connects, it joins its own user room and every group room it
belongs to:

```js
socket.join(socket.userId)
myGroups.forEach((g) => socket.join(`group:${g._id}`))
```

Then sending to exactly the right people is one line:

```js
getIO()?.to(receiverId).emit('new-message', message)     // private
getIO()?.to(roomOf(group)).emit('new-message', full)     // group
```

**Why rooms instead of `io.emit()`?** `io.emit()` sends to *everybody connected*.
Your private message would arrive on every stranger's machine. Rooms are how you
avoid that.

### The socket is authenticated too

`io.use()` runs before any connection is accepted. It reads the same cookie and
verifies the same JWT, so a logged-out person cannot open a socket and listen.

### Two bugs this code deliberately avoids

**1. Duplicate listeners.** `useChatSocket` returns a cleanup function that calls
`socket.off(...)` for every listener it added. Without it, every re-render adds
another listener and one message shows up five times.

**2. Stale closures.** The listeners are created once. If they read `selectedId`
directly they would capture the *first* value forever, so opening a new chat
would break them. Instead they read `selectedIdRef.current`, and a ref always
holds the latest value. This is the single most common React interview trap and
the code has a comment on it.

---

## 6. Data flow — where state lives and why

```
        AuthProvider          who is logged in          (context: everyone needs it)
             │
        SocketProvider        the live connection       (context: everyone needs it)
             │
          Chat page           which chat is open        (useState: only this page)
             │
   ┌─────────┼──────────┬───────────────┐
   ▼         ▼          ▼               ▼
useChatList  useMessages  useChatSocket  useMessageActions
(the list)   (one chat)   (live events)  (the long-press menu)
   │            │
   ▼            ▼
Sidebar     ChatWindow      ← components only receive props and render
```

**The rule:** state lives at the lowest level that still works.

- Logged-in user → **Context**, because the sidebar, the header and the message
  bubbles all need it, and passing it down five levels is prop drilling.
- Which chat is open → **`useState` in `Chat.jsx`**, because only that page and
  its children care.
- Search box text → **`useState` inside the component**, because nothing outside
  it will ever need it.

**Why the components are "dumb":** `Sidebar.jsx` and `ChatWindow.jsx` make no API
calls and hold almost no state. They take props and render. That means you can
look at them and immediately see what they show, and the logic is all in hooks
where it can be read without JSX in the way.

**Why `Chat.jsx` is long but simple:** it is the *composition root* — the place
where all the hooks get connected to all the components. It is nearly all wiring
and JSX. There is deliberately no business logic in it.

---

## 7. The chat list — how the three tabs are built

The sidebar merges **three** sources into one list:

```
GET /api/users                    every registered person
GET /api/messages/conversations   last message + unread count per person
GET /api/groups                   my groups
```

`useChatList` merges them by id, then filters by tab:

| Tab | Rule |
|---|---|
| **Chats** | I have sent them at least one message (`iReplied`) |
| **Requests** | They messaged me, I have not replied (`theyMessaged && !iReplied`) |
| **All people** | Everyone, so you can start a new conversation |

The `iReplied` / `theyMessaged` flags are computed on the server while walking
the message list, so the client never has to scan every message.

---

## 8. Mobile — the part that took the most work

Mobile browsers have three things that break normal web layouts. Each has a
different fix, and all three are in `useVisualViewport.js` + `styles/index.css`.

### Problem 1: `100vh` is a lie

On phones, `100vh` does not include the browser's URL bar, so a full-height page
is always slightly too tall. **Fix:** JavaScript measures the real visible height
and writes it to a CSS variable, `--app-height`, which the app shell uses.

### Problem 2: the keyboard

There are two "viewports": the **layout** viewport (what CSS measures) and the
**visual** viewport (what you can actually see). When the keyboard opens:

- **Android Chrome** shrinks the layout viewport → CSS notices
- **iOS Safari** does *not* → CSS has no idea, and the text box ends up hidden
  behind the keyboard

**Fix:** the `visualViewport` API reports the truth on both. We write the real
height into `--app-height` and the app shell shrinks — so the composer sits just
above the keyboard on its own, with no `position: fixed` hacks.

### Problem 3: notches and gesture bars

`env(safe-area-inset-top / bottom)` gives the size of the unusable strips, but
**only if `viewport-fit=cover` is in the viewport meta tag**. That is why the
header has top padding and the bottom nav has bottom padding.

### The bug that actually caused the broken layout

The composer kept getting pushed off screen. The reason was not the keyboard at
all — it was this CSS default:

```css
/* a flex child defaults to min-height: auto, meaning
   "never shrink below my content" */
```

So the message list grew to fit *all* its messages and shoved the composer out
of view. The fix is one class:

```jsx
<div className="flex-1 min-h-0 overflow-y-auto">   {/* min-h-0 is the fix */}
```

`min-h-0` lets it shrink, so it scrolls instead of growing. **This is a great
thing to be able to explain** — it is a real CSS gotcha, not a library quirk.

---

## 9. Media uploads — why the file goes through our server

```
browser  ──►  our server  ──►  Cloudinary  ──►  URL back  ──►  MongoDB
```

**Why not upload straight from the browser to Cloudinary?** That needs the
Cloudinary API secret in the browser, and anything in browser JavaScript is
public. So the file goes to our server, which holds the secret in `.env`.

MongoDB stores only the **URL**, never the file. Databases are bad at binary
blobs — they get slow and expensive.

Validation happens **twice**, on purpose:

- **Frontend** (`utils/mediaValidation.js`) so the user gets an instant error
- **Backend** (`config/cloudinary.js`) because someone can bypass the frontend

The limits live in `constants/media.js` so the file picker, the validator and
the error messages can never disagree.

---

## 10. Database design

Three collections:

**User** — name, username (optional, not unique — only email is), email,
password (bcrypt hash, `select: false` so normal queries never return it, `null`
for Google-only accounts), googleId, profileImage, isOnline, lastSeen, plus four
relationship arrays: `blockedUsers`, `pinnedChats`, `archivedChats`,
`hiddenChats`, `chatList`.

**Group** — name, image, admin, members.

**Message** — sender, and then *either* `receiver` (private) *or* `group`
(group), never both. Plus `messageType`, `text`, `mediaUrl`, `isRead`,
`readBy`, `replyTo`, `deletedFor`, `isForwarded`.

### Design decisions worth explaining

**Why one Message collection for both private and group chats?** Because a
message is a message — same fields, same rules for editing and deleting. Two
collections would mean duplicating every query and every permission check.

**Why `isRead` for private but `readBy` (an array) for groups?** A private
message has exactly one reader, so a boolean is enough. A group message has many,
so you need to know *who* has read it.

**Why is account deletion a "soft delete"?** If we actually removed the user
document, every message they ever sent would point at a missing user and the
other person's chat history would break. Instead we set `isDeleted: true`, blank
the profile and scramble the email (so the same Google account can sign up fresh).
Their messages survive on the other side.

**Why does `deletedFor` exist separately from real deletion?** Two different
features:

| Action | What happens | Who can do it |
|---|---|---|
| **Unsend** | The document is deleted for everyone | Only the sender |
| **Delete for me** | Your id goes into `deletedFor`; queries skip it | Anyone in the chat |

**Why do forwarded messages have an empty `mediaPublicId`?** `mediaPublicId` is
the handle used to delete the file from Cloudinary. If a forward kept the
original's handle, deleting the forward would destroy the original's image and
leave a broken picture in the first chat.

---

## 11. Routing

Six routes, defined in `routes/AppRoutes.jsx`:

| Path | Page | Guard |
|---|---|---|
| `/` | Landing page | Public only — logged-in users go to `/chat` |
| `/login` | Email+password login, or Google | Public only |
| `/signup` | Username + email + password signup, or Google | Public only |
| `/forgot-password` | Email → emailed code → new password | Public only |
| `/create-password` | First-time password for a Google-only account | Logged in, `needsPassword: true` only |
| `/chat` | The app | Protected — logged-out users go to `/login`; `needsPassword: true` users go to `/create-password` first |

Every guard waits for `loading` to finish first. Without that wait there is a
moment where `user` is still `null` because `/auth/me` has not answered yet, and
a logged-in user gets bounced to the login page on every refresh.

### The Android back button

There is a second kind of "routing" on mobile: pressing **Back** inside a chat
should return to the chat list, not close the website. `useBackGuard` handles it
by pushing a fake history entry whenever something opens (a chat, a bottom
sheet, a dialog). Back pops that entry instead of leaving the site. On the Chats
list there is no fake entry, so Back exits — exactly like a real app.

---

## 12. Performance — the deliberate choices

| Technique | Where | Why |
|---|---|---|
| `React.memo` | `MessageBubble` | One new message re-rendered all 100 bubbles |
| `useCallback` | handlers passed to memoized children | Without it, new function every render, so `memo` never helps |
| `useMemo` | the merged chat list | Rebuilding it on every keystroke was wasteful |
| `requestAnimationFrame` | viewport measuring | Resize fires dozens of times per second |
| debounce (400 ms) | user search | One request when typing stops, not one per letter |
| `passive: true` | scroll listeners | Tells the browser we will not block the scroll |
| `ResizeObserver` | message list | Images loading late changed the height and made the chat jump |

**Important:** `memo` is used where it was measured to matter, not everywhere.
Wrapping everything in `memo` makes code slower *and* harder to read, because
every prop comparison costs something.

---

## 13. Questions you should be ready for

**"How do you know a message was actually delivered?"**
Three states, shown under my last message: **Sent** (in the database),
**Delivered** (they are online), **Seen** (they opened the chat, which fires
`PUT /api/messages/:userId/read`, which emits `messages-read` back to me).

**"What happens if two people block each other?"**
`isBlockedBetween()` checks *both* directions, so one block stops messages both
ways. It is enforced in the route, not in the UI — hiding the input box is a
courtesy, the 403 is the actual rule.

**"How would you scale this?"**
Right now Socket.IO keeps connections in one server's memory, so two servers
would not see each other's rooms. The fix is the Redis adapter, which puts room
membership in Redis. Messages are already capped at 100 per load; the next step
is proper pagination.

**"How do you sign someone up with a password without an email service to verify them?"**
You reuse an identity provider you already trust for something else. Google
already proves someone owns an email when they sign in with it — the signup
and forgot-password flows just ask for one extra Google sign-in at the right
moment and check its email against what the user typed. See section 4.2 / 4.3.

**"What is the weakest part?"**
No automated tests beyond one integration script (and that script does not yet
cover the newer password-auth endpoints — see `TESTING.md`), and no
TypeScript. Rate limiting and CSRF protection used to be on this list — both
are now in place (`middleware/rateLimit.js`, `middleware/csrf.js`).

---

## 14. If you only remember six things

1. **HTTP saves it, the socket announces it.** Two channels, two jobs.
2. **Never trust the client.** Every rule is enforced again on the server.
3. **The JWT lives in an httpOnly cookie**, so page scripts cannot read it.
4. **`min-h-0`** is what keeps the message box above the keyboard.
5. **Soft delete** keeps the other person's chat history from breaking.
6. **Proof of email ownership is a code you had to receive.** Signup and
   password reset both email a 6-digit code and ask for it back — hashed,
   expiring, attempt-limited, and never reusable across the two flows.
