# Deployment — Render (backend) + Vercel (frontend)

Backend Render par, frontend Vercel par. Dono free tier me chal jate hain.

Order important hai: **pehle backend**, kyunki uska URL frontend me daalna padta hai.
Frontend ka URL phir wapas backend me daalna padta hai. Isliye last me ek chhota
"dono ko jodo" step hai.

---

## 0. Pehle se taiyaar hona chahiye

| Cheez | Kahan check karein |
|---|---|
| Code GitHub par push hai | `github.com/sachin-codes01/MERN-Projects` |
| Atlas me IP `0.0.0.0/0` allowed hai | Atlas → Network Access |
| Cloudinary ki 3 keys hain | `server/.env` |
| Google Client ID hai | `client/.env` |

Render/Vercel ka IP fix nahi hota, isliye Atlas me `0.0.0.0/0` hona hi padega —
warna deploy hone ke baad database connect nahi hoga.

**Folder ke naam ke baare me:** pehle folder ka naam `Vārtālāpaḥ-ChattingApp` tha,
lekin Render ka Root Directory field sirf `A-Za-z0-9-_./` allow karta hai — `ā` aur `ḥ`
wahan reject ho jate the. Isliye folder ab `Vartalapah-ChattingApp` hai. Aage koi naya
project banao to folder ka naam plain English me hi rakhna.

---

## 1. Backend — Render

### 1.1 Service banao

1. https://dashboard.render.com → **New +** → **Web Service**
2. GitHub connect karo → repo `MERN-Projects` select karo

### 1.2 Settings

| Field | Value |
|---|---|
| Name | `vartalapah-server` (kuch bhi) |
| Region | Singapore (India se sabse paas) |
| Branch | `main` |
| **Root Directory** | `Vartalapah-ChattingApp/server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

Root Directory zaroori hai — repo me kai projects hain, iske bina Render galat
folder me `npm install` chalayega.

### 1.3 Environment variables

Render ke **Environment** section me ye daalo (`server/.env` se copy karo):

```
NODE_ENV=production
MONGO_URI=<Atlas wali poori string>
JWT_SECRET=<server/.env se>
GOOGLE_CLIENT_ID=<server/.env se>
CLOUDINARY_CLOUD_NAME=<server/.env se>
CLOUDINARY_API_KEY=<server/.env se>
CLOUDINARY_API_SECRET=<server/.env se>
CLIENT_URL=http://localhost:5173
```

Do baatein:

- **`PORT` mat daalna.** Render khud PORT deta hai aur `server.js` usko
  `process.env.PORT` se utha leta hai. Khud set karoge to service start hi nahi hogi.
- **`NODE_ENV=production` zaroori hai.** Isse cookie `secure: true` +
  `sameSite: 'none'` ho jati hai — cross-domain login isi par tika hai.
- `CLIENT_URL` abhi localhost hi rehne do, step 3 me sahi kar denge.

### 1.4 Deploy

**Create Web Service** dabao. 2-3 minute lagenge. Logs me ye dikhna chahiye:

```
[OK] MongoDB connected: instachats
[OK] Socket.IO ready
[OK] Server chal raha hai: http://localhost:10000
```

URL milega — isko copy kar lo. Is project ka live backend:
**`https://vartalapah-chattingapp.onrender.com`**

Browser me test: `https://vartalapah-chattingapp.onrender.com/api/health`
→ `{"success":true,"database":"connected",...}` aana chahiye.

---

## 2. Frontend — Vercel

### 2.1 Project banao

1. https://vercel.com/new → repo `MERN-Projects` import karo
2. Settings:

| Field | Value |
|---|---|
| Framework Preset | Vite |
| **Root Directory** | `Vartalapah-ChattingApp/client` |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

### 2.2 Environment variables

```
VITE_API_URL=https://vartalapah-chattingapp.onrender.com
VITE_GOOGLE_CLIENT_ID=<client/.env se>
```

`VITE_API_URL` ke aakhir me slash **mat** lagana. Code `${API_URL}/api${path}`
banata hai — slash lagane se `//api` ho jayega aur har request 404 degi.

### 2.3 Deploy

**Deploy** dabao. URL milega jaise `https://vartalapah-chatting-app-lac.vercel.app`.

`client/vercel.json` me SPA rewrite already hai — iske bina `/chat` par page
refresh karne se 404 aata, kyunki wo route sirf React Router ke andar exist karta hai.

---

## 3. Dono ko jodo (ye step chhodna mat)

Ab Vercel ka URL backend ko batana hai, warna CORS block kar dega.

1. Render → apni service → **Environment**
2. `CLIENT_URL` ko edit karo → `https://vartalapah-chatting-app-lac.vercel.app` (slash ke bina)
3. Save → Render khud redeploy karega

Ye value `server.js` ke CORS aur `socket/index.js` dono me jati hai — matlab
API calls aur real-time socket, dono isi par depend karte hain.

---

## 4. Google Login ko allow karao

Google apne aap naye domain se login nahi chalne dega.

1. https://console.cloud.google.com/apis/credentials
2. Apni OAuth 2.0 Client ID kholo
3. **Authorized JavaScript origins** me add karo: `https://vartalapah-chatting-app-lac.vercel.app`
4. Save (asar hone me kabhi kabhi 5 minute lagte hain)

---

## 5. Check karo sab chal raha hai

| Test | Kya hona chahiye |
|---|---|
| `<render-url>/api/health` | `database: "connected"` |
| Vercel site khulti hai | Home page dikhe |
| Google se login | Chat page par pahunch jao |
| Refresh on `/chat` | 404 nahi, page wapas aaye |
| Do browser me message | Turant dusri taraf dikhe (socket) |
| Image upload | Cloudinary par chali jaye |

---

## 6. Kuch galat ho to

**CORS error console me**
`CLIENT_URL` Render me galat hai. Exactly Vercel wala URL hona chahiye —
`https://` ke saath, aakhir me slash ke bina. Badal ke redeploy karo.

**Login hota hai par refresh karte hi logout**
Cookie save nahi ho rahi. Render me `NODE_ENV=production` check karo — yahi
`sameSite: 'none'` aur `secure: true` on karta hai, jinke bina browser
cross-domain cookie reject kar deta hai.

**Socket connect nahi hota**
Wahi `CLIENT_URL` wali baat — socket ka CORS bhi usi se chalta hai.

**Pehli request par site 50 second atakti hai**
Render free tier 15 minute inactivity ke baad service so jati hai, aur pehli
request use jagati hai. Normal hai. Interview/demo se 5 minute pehle site
ek baar khol lena.

**`bad auth` ya database connect nahi hota**
Atlas → Network Access me `0.0.0.0/0` hai? Aur `MONGO_URI` me password
sahi paste hua (`<db_password>` placeholder to nahi rah gaya)?

**Build fail — module not found**
Root Directory galat hai. Backend ke liye `.../server`, frontend ke liye
`.../client` — repo root nahi.

---

## Baad me update kaise karein

`main` par push karte hi Render aur Vercel dono apne aap redeploy kar dete hain.
Alag se kuch nahi karna.
