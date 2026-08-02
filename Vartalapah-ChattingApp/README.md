# Vārtālāpaḥ — Real-time Chat App (MERN + Socket.IO)

Ek full-stack chat app: Google sign-in, private aur group chat, photo/video sharing,
typing indicator, online status, blue tick, block/pin/archive — sab real-time.

**Stack:** React (Vite) · Tailwind CSS v4 · MUI · Node.js · Express · MongoDB (Mongoose) · Socket.IO · Cloudinary · JWT

---

## 1. Chalane ka tarika

```bash
npm install --prefix server && npm run dev --prefix server
```

```bash
npm install --prefix client && npm run dev --prefix client
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:5000`

`.env` files banane ka poora step-by-step tarika **[SETUP.md](SETUP.md)** me hai
(Google Client ID + Cloudinary keys).

---

## 2. Folder structure

### Backend (`server/`)

```
server.js              Entry file - middleware lagao, routes mount karo, server start
config/
  db.js                MongoDB connection (+ common errors ke hints)
  cloudinary.js        Cloudinary + multer setup, media rules (5MB image / 20MB video)
models/
  User.js              User schema (blockedUsers, pinnedChats, soft delete...)
  Group.js             Group schema (admin + members)
  Message.js           Message schema (private + group dono isi me)
  index.js             Teeno ko ek saath export karta hai
middleware/
  protect.js           Cookie se JWT padho -> req.user set karo (login check)
  errorHandler.js      404 + central error handler
routes/
  auth.js              /api/auth   - Google login, profile, logout, delete account
  users.js             /api/users  - list, search, block/pin/archive/hide
  messages.js          /api/messages - conversations, send, edit, delete, read
  groups.js            /api/groups - create, rename, members add/remove, delete
  upload.js            /api/upload - file -> Cloudinary -> URL
socket/
  index.js             Socket.IO - auth, rooms, typing, online/offline
utils/
  token.js             COOKIE_NAME, cookie options, JWT banana, publicUser()
  relations.js         isBlockedBetween(), withRelations(), PUBLIC_FIELDS
  groupRooms.js        roomOf(), getGroupIfMember() - routes ke beech shared
test-api.js            60 automated API tests (npm test)
```

### Frontend (`client/src/`)

```
main.jsx               Saare providers (Google, Router, Theme, Auth, Socket)
App.jsx                Routes + ProtectedRoute / PublicOnlyRoute
api/
  client.js            api() aur uploadFile() - backend se baat karne ka EK rasta
context/
  AuthContext.jsx      Logged-in user poori app me
  SocketContext.jsx    Socket connection + online users
  ThemeContext.jsx     Light / dark mode
hooks/
  useChatList.js       Sidebar ka data (users + conversations + groups)
  useMessages.js       Khuli hui chat (load, send, edit, delete, typing)
  useChatSocket.js     Saare socket.on() listeners ek jagah
  useGroupActions.js   Group banana / badalna / delete
  useProfileActions.js Apni profile aur account delete
  useToast.js          Neeche dikhne wale chhote message
components/
  chat/                Sidebar, ChatWindow, Dialogs, GroupDialogs
  home/                Landing page ke sections + homeContent.jsx (saara text)
pages/
  Home.jsx             Landing page (sections ko jodta hai)
  Login.jsx            Google sign-in
  Chat.jsx             Chat page - hooks ko components se jodta hai
utils/
  format.js            timeOf, previewOf, lastSeenText, senderIdOf
  media.js             File validation (type, size, video duration)
```

---

## 3. Flow samajhne ke liye (interview me yahi poochha jata hai)

### A. Login kaise hota hai

```
User "Sign in with Google" dabata hai
  -> Google ek credential token deta hai (frontend ko)
  -> POST /api/auth/google  { credential }
  -> Backend Google se token VERIFY karta hai (frontend par bharosa nahi)
  -> User database me hai to le lo, nahi to bana do
  -> Apna JWT banakar httpOnly cookie me bhej do
  -> Frontend ko sirf user ka data milta hai, token JavaScript se dikhta hi nahi
```

**Cookie kyun, localStorage kyun nahi?**
`httpOnly` cookie ko JavaScript padh hi nahi sakta, isliye XSS attack me token chori
nahi hota. `sameSite: 'lax'` CSRF se bachata hai.

### B. Page refresh ke baad login kaise bana rehta hai

`AuthContext` app khulte hi `GET /api/auth/me` bulata hai. Cookie browser me pehle se
hai, isliye backend bata deta hai ki user kaun hai.

> Logged-out hone par is call ka **401 aana normal hai** — DevTools me laal dikhta hai
> lekin ye error nahi, bas "abhi login nahi ho" ka jawab hai.

### C. Message bhejne ka poora rasta

```
1. Media hai to pehle POST /api/upload -> Cloudinary -> URL wapas
2. POST /api/messages  { receiver ya group, text/mediaUrl }
3. Backend message MongoDB me save karta hai
4. Backend Socket.IO se receiver ke room me 'new-message' emit karta hai
5. Receiver ke useChatSocket me listener chalta hai -> message screen par
```

Bhejne wale ko response me hi message mil jata hai (turant dikhta hai),
receiver ko socket se milta hai.

### D. Socket rooms

- Har user apni **id** ke naam ke room me hota hai → `io.to(userId).emit(...)` se sirf usi ko jata hai
- Har group `group:<groupId>` room me → ek emit se saare members ko mil jata hai

### E. Real-time me sabse badi galti (aur uska fix)

`useChatSocket.js` me `useEffect` ke aakhir me `socket.off(...)` **cleanup** hai.
Ye na ho to har render par naya listener judta jayega aur ek message 5-5 baar dikhega.

Dusri baat — listeners sirf ek baar bante hain, isliye unke andar `selectedId` ki
purani value phans jati hai (**stale closure**). Isliye `selectedIdRef` (ref) use kiya
hai — ref ki `.current` value hamesha latest hoti hai.

---

## 4. Design decisions (kyun aisa banaya)

| Faisla | Wajah |
|---|---|
| **Soft delete** (`isDeleted: true`) | User ka document mita denge to saamne wale ki purani chat toot jayegi |
| **Media Cloudinary par** | MongoDB me sirf URL — database chhota aur fast rehta hai |
| **Ek `/relation` endpoint** | block/pin/archive/hide ke 8 alag routes ki jagah ek — samajhne me aasan |
| **Validation dono taraf** | Frontend par turant feedback ke liye, backend par isliye kyunki koi Postman se seedha bhej sakta hai |
| **Custom hooks** | Chat page pehle 1200 lines ka tha; ab har hook ka ek hi kaam hai |
| **Group me sirf jaan-pehchan wale** | Anjaan aadmi ko group me nahi ghusa sakte — rule backend par bhi lagu hai |

---

## 5. Testing

```bash
npm test --prefix server
```

60 automated tests — auth, users, block, messages, groups, upload, account delete.
Ye script khud test users banati hai, unke JWT khud sign karti hai (Google login ki
zarurat nahi) aur aakhir me saara test data database se hata deti hai.

Browser me manually kya-kya check karna hai, uski poori list **[TESTING.md](TESTING.md)** me hai.
