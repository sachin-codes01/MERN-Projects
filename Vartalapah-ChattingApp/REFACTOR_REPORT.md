# Refactor Report

Audit and cleanup of the Vārtālāpaḥ codebase, plus the mobile UX work that
preceded it.

**Branch:** `refactor/mobile-ux-and-structure`
**Verification:** `npm run build` passes; `node --check` passes on every server
file. No feature, route, API contract or database field was removed.

---

## 1. Honest summary first

Two things in this report are worth reading before the rest:

- **The "unused dependencies" list is empty.** Four packages *look* unused
  because nothing imports them by name. They are all required. Details in
  section 4 — removing them would have broken the build, which is exactly the
  kind of mistake a cleanup pass is supposed to avoid.
- **The authenticated screens were not tested end-to-end.** Signing in requires
  Google credentials. The build passes and the layout was verified in a browser
  with mock data, but nobody has clicked through a real logged-in session since
  the refactor. See section 10.

---

## 2. Files removed

| File | Why |
|---|---|
| `client/src/api/client.js` | Replaced by `api/httpClient.js` plus five per-resource modules |
| `client/src/components/chat/Dialogs.jsx` | Grab-bag of four unrelated dialogs; split into focused files |
| `client/src/components/chat/GroupDialogs.jsx` | Two dialogs plus a shared picker in one file; split |

Nothing else was deleted. Several things that *looked* dead turned out not to be
— see section 4.

---

## 3. Files renamed or moved

### Renamed for clarity

| Before | After | Reason |
|---|---|---|
| `App.jsx` | `routes/AppRoutes.jsx` | It is the route table, not the app |
| `utils/media.js` | `utils/mediaValidation.js` | It only validates; the name promised more |
| `utils/media.download.js` | `utils/mediaFile.js` | It also shares, not just downloads |
| `hooks/useIsMobile.js` | `hooks/ui/useMediaQuery.js` | Exports three hooks, not one |
| `components/chat/muiStyles.js` | `styles/muiStyles.js` | Not chat-specific |
| `components/home/homeContent.jsx` | `constants/homeContent.jsx` | It is copy/data, not a component |

### Moved into the new structure

```
components/ClickSpark.jsx        -> components/ui/ClickSpark.jsx
components/chat/ActionSheet.jsx  -> components/ui/ActionSheet.jsx
index.css                        -> styles/index.css
hooks/useChatList.js             -> hooks/chat/useChatList.js      (+ 5 more)
hooks/useToast.js                -> hooks/ui/useToast.js           (+ 5 more)
```

### New files

**API layer** — `api/httpClient.js`, `authApi.js`, `messageApi.js`,
`userApi.js`, `groupApi.js`, `uploadApi.js`

**Constants** — `constants/media.js`, `chat.js`, `theme.js`, `storageKeys.js`

**Split out of the two grab-bags** — `UserProfileDialog.jsx`,
`MyProfileDialog.jsx`, `ConfirmDialog.jsx`, `ChatListActionSheet.jsx`,
`CreateGroupDialog.jsx`, `GroupInfoDialog.jsx`, `MemberPicker.jsx`

**Extracted from `Chat.jsx`** — `hooks/chat/useMessageActions.jsx`,
`hooks/chat/useChatRelations.js`

**Shared, to remove duplication** — `components/ui/ChatAvatar.jsx`,
`hooks/ui/useSelection.js`

---

## 4. What was checked and deliberately *not* removed

This is the most useful section, because "I checked and it is needed" is a
better answer than a long deletion list.

| Suspect | Verdict |
|---|---|
| `@emotion/react`, `@emotion/styled` | **Keep.** Required peer dependencies of MUI. Nothing imports them directly, but MUI does not run without them. |
| `tailwindcss` | **Keep.** `@tailwindcss/vite` is only the plugin; this is the engine. |
| `nodemon` | **Keep.** Used by `npm run dev` in `server/package.json`. |
| `client/public/vartalapah.png` | **Keep.** It is the screenshot embedded in `README.md`. |
| All 3 font files | **Keep.** Cyrene powers `.brand-font`, both Belgium weights power `.display-font` (15 usages). |
| All 9 poster images | **Keep.** Used by the landing page marquee and the login art. |
| `server/test-api.js` | **Keep.** A working integration test script — an asset in an interview, not clutter. |

### Actually removed as dead

| Item | Where |
|---|---|
| `VIDEO_TYPES` export | `server/config/cloudinary.js` — used internally, never imported |
| `--font-brand`, `--font-ui` | `styles/index.css` — generated Tailwind utilities nobody used |
| `export` on `useMediaQuery` | `hooks/ui/useMediaQuery.js` — internal helper, now private |
| `export` on `fileNameFor` | `utils/mediaFile.js` — internal helper, now private |
| `IMAGE_TYPES` / `MAX_IMAGE_MB` exports | Superseded by `constants/media.js` |
| `instachats_selected_id` key | Removed from `localStorage` on load; feature intentionally dropped |

No `console.log` statements were removed from application code — there were none.
The ones in `server/` are startup logs and error reporting, which are meant to be
there.

---

## 5. Duplicate code removed

| Duplication | Copies | Fix |
|---|---|---|
| Avatar rendering (group icon vs photo, online dot, brand colour) | 8 | `components/ui/ChatAvatar.jsx` |
| "toggle an id in a selected array" | 3 | `hooks/ui/useSelection.js` |
| Accepted MIME types written out by hand | 5 | `constants/media.js`, with `IMAGE_ACCEPT` / `MEDIA_ACCEPT` derived from the lists |
| Brand hex codes in MUI `sx` props | 11 | `constants/theme.js` |
| `localStorage` key strings | 4 | `constants/storageKeys.js` |
| Raw endpoint path strings in hooks/components | 27 | `api/*.js` modules |

The MIME-type one was the most valuable: the file picker's `accept` attribute,
the client validator and the server validator each had their own copy, so adding
a format meant remembering three places.

---

## 6. Magic numbers replaced

All moved into `constants/chat.js`, each with a comment explaining what breaks if
you change it:

`TYPING_IDLE_MS` (1500), `SEARCH_DEBOUNCE_MS` (400),
`SCROLL_STICK_THRESHOLD_PX` (120), `MESSAGE_HIGHLIGHT_MS` (1500),
`LONG_PRESS_MS` (450), `LONG_PRESS_MOVE_TOLERANCE_PX` (10),
`MIN_TAP_TARGET_PX` (44), `KEYBOARD_DETECT_THRESHOLD_PX` (150),
`MESSAGE_PAGE_SIZE` (100), `MAX_MESSAGE_LENGTH` (2000),
`TOAST_ERROR_MS` (4000), `TOAST_SUCCESS_MS` (2500)

---

## 7. Large components split

| File | Before | After | How |
|---|---|---|---|
| `pages/Chat.jsx` | ~600 | 495 (364 code) | Logic moved to `useMessageActions` and `useChatRelations`; it is now a composition root |
| `Dialogs.jsx` | 299 | deleted | → 3 dialogs + 1 action sheet |
| `GroupDialogs.jsx` | 349 | deleted | → 2 dialogs + `MemberPicker` |
| `ChatWindow.jsx` | 440 | 452 (351 code) | `MessageBubble` extracted and memoized |

### Files still over 300 lines, and why they were left alone

Per your instruction not to split files that read fine as one unit. Line counts
below are total / code-only (comments and blanks stripped):

| File | Total | Code | Why it stays |
|---|---|---|---|
| `HeroMessageFlow.jsx` | 536 | 306 | One animation, one concern |
| `useMessages.js` | 528 | 339 | One chat's whole lifecycle; splitting would scatter related state |
| `Chat.jsx` | 495 | 364 | Composition root — almost entirely JSX wiring |
| `MediaViewer.jsx` | 465 | 333 | One component; the gesture handlers belong together |
| `ChatWindow.jsx` | 452 | 351 | Header + list + composer, read top to bottom |
| `routes/messages.js` | 653 | — | Server: one resource, reads as a list of endpoints |

Roughly 35–45% of each file is explanatory comments, which was a goal rather
than something to trim.

---

## 8. Error handling improved

**Two silent failures fixed.** `loadConversations()` and `loadGroups()` in
`useChatList.js` had completely empty `catch {}` blocks. If the backend was down,
the sidebar rendered empty and the user reasonably concluded all their chats had
been deleted. Both now surface a toast and let the app keep running.

**Network errors are now distinguishable.** `httpClient.js` separates "could not
reach the server" from "the server said no", so an offline user sees *Cannot
reach the server. Check your internet connection.* instead of a generic message.

**Partial failures are reported honestly.** Forwarding to several chats uses
`Promise.allSettled`, and if some fail the user is told how many rather than
seeing a blanket success.

---

## 9. Security review

**Checked and clean:**

- `.env` is git-ignored and has never been committed (`git ls-files` confirms)
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` anywhere
- No secrets hardcoded in source
- `localStorage` holds only the theme and one timestamp — no tokens, no PII
- JWT is in an `httpOnly` + `secure` + `sameSite` cookie, unreadable by scripts
- CORS is locked to `CLIENT_URL`, not `*`
- User search input is regex-escaped before hitting MongoDB
- Production error responses hide internal messages
- Every permission rule (block, group admin, message ownership) is enforced
  server-side, not just hidden in the UI

**Not fixed — recommended, but out of scope for a no-behaviour-change pass:**

- **No rate limiting** on `/api/auth/google` or `/api/upload`. `express-rate-limit`
  would be roughly ten lines and is the single highest-value security addition.
- **No `helmet`** for security headers.
- The screenshot endpoint has a 5-second dedupe but no hard per-user cap.

---

## 10. Breaking changes

Two, both intentional and both requested:

1. **Reopening the app always lands on the Chats list.** Previously the open chat
   was saved in `localStorage` and restored. This was requested explicitly
   ("Reopening the website always starts on the Chats page"). The side effect is
   that a desktop refresh no longer keeps you in the conversation. Easy to scope
   back to mobile only if you want it.

2. **Message bubbles are no longer text-selectable on touch.** Long press now
   opens the action menu instead of the OS text-selection popup — the two cannot
   coexist. Copy is available in that menu, and desktop selection is unaffected.

Nothing else changed behaviour. All routes, API contracts, socket events and
database fields are unchanged apart from the three new `Message` fields
(`replyTo`, `deletedFor`, `isForwarded`), which are additive and default to
empty.

---

## 11. What was NOT verified

Stated plainly so it does not get mistaken for tested work:

- **No end-to-end run of the authenticated app.** Login needs your Google
  account. The build compiles and the layout was verified in a browser against
  mock data, but the real logged-in flow has not been clicked through since the
  refactor.
- **Real devices.** Behaviour was verified via the visualViewport API and
  measured layout boxes, not on physical iOS/Android hardware.
- **`server/test-api.js` was not run.** It talks to the live MongoDB Atlas
  database and creates then deletes test users; that seemed like your call, not
  mine.

**Recommended first check:** log in, send a message, open a photo, long-press a
message, and press Android Back inside a chat. That exercises every layer.

---

## 12. Suggested future improvements

In the order I would actually do them:

1. **Run `test-api.js`** and extend it to cover reply, forward and delete-for-me.
2. **Rate limiting + helmet** on the server (~15 lines, real security gain).
3. **TypeScript**, incrementally — start with `api/` and `constants/`, where
   types pay off immediately and the risk is lowest.
4. **Message pagination.** The 100-message cap is a silent truncation today; an
   older-messages loader would fix it.
5. **Socket.IO Redis adapter**, needed the moment there is more than one server
   process.
6. **ESLint + Prettier** with a pre-commit hook, so formatting stops being a
   manual concern.
7. **Component tests** for the tricky hooks — `useBackGuard` and
   `useVisualViewport` have subtle logic that deserves protection.
