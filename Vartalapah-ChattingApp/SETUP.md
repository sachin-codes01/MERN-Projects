# Vārtālāpaḥ — Setup Guide

Do external services chahiye: **Google** (login ke liye) aur **Cloudinary** (photo/video store karne ke liye).
Dono bilkul free hain, credit card nahi maangte.

> **Google Client ID ab sirf "Sign in with Google" button ke liye nahi chahiye.**
> Username + password se signup karte waqt, aur "Forgot password" karte waqt bhi
> email ki malikiyat isi Google se verify hoti hai (koi email/SMS service nahi
> hai project me) - isliye Part 1 skip mat karna, chahe tum sirf password wala
> login banana chahte ho.

---

## Part 1 — Google Client ID

### Step 1: Google Cloud Console kholo

https://console.cloud.google.com

Apne Gmail se login karo. Pehli baar ho to Terms accept karna padega.

### Step 2: Naya project banao

- Upar left me project dropdown (Google Cloud ke bagal me) par click karo
- **New Project**
- Name: `Vartalapah`
- **Create** → 10-15 second lagenge
- Ban jane ke baad usi dropdown se **Vartalapah select karo** (ye step log bhool jate hain)

### Step 3: OAuth consent screen setup

Left menu (☰) → **APIs & Services** → **OAuth consent screen**

> Google ne 2025 me UI badla hai. Agar tumhe **"Google Auth Platform"** dikhe to
> wahan **Branding**, **Audience**, **Clients** naam ke tabs honge — same cheez hai.

Bharna kya hai:

| Field | Value |
|---|---|
| App name | `Vartalapah` |
| User support email | apna Gmail |
| Audience / User Type | **External** |
| Developer contact email | apna Gmail |

**Save and Continue** dabate raho. Scopes wala page **skip** kar do.

### Step 4: Apne aap ko Test User banao (ZAROORI)

**Audience** tab (ya consent screen ka "Test users" section) me:

- **+ Add Users**
- Apna Gmail address daalo
- **Save**

⚠️ Ye step miss kiya to login karte waqt **"Access blocked: has not completed the Google verification process"** error aayega.
App abhi "Testing" mode me hai, isliye sirf test users hi login kar sakte hain.

### Step 5: Client ID banao

Left menu → **Credentials** (ya **Clients** tab)

- **+ Create Credentials** → **OAuth client ID**
- Application type: **Web application**
- Name: `Vartalapah Web`

**Authorized JavaScript origins** — **+ Add URI** dabakar ye dono daalo:

```
http://localhost:5173
```
```
http://localhost:5000
```

**Authorized redirect URIs** — **khali chhod do**.
Humara login popup se hota hai, redirect nahi hota. Isliye iski zarurat nahi.

**Create** dabao.

### Step 6: Client ID copy karo

Popup khulega jisme:

- **Client ID** — kuch aisa: `81234567890-abc123xyz.apps.googleusercontent.com` ✅ **ye chahiye**
- **Client Secret** — ❌ **ise chhuo mat**, humare flow me iski zarurat hi nahi

Client ID copy kar lo.

### Step 7: Client ID dono .env files me daalo

**`client/.env`**
```
VITE_GOOGLE_CLIENT_ID=81234567890-abc123xyz.apps.googleusercontent.com
```

**`server/.env`**
```
GOOGLE_CLIENT_ID=81234567890-abc123xyz.apps.googleusercontent.com
```

Dono me **bilkul same** value honi chahiye.
Backend isi se check karta hai ki token humari hi app ka hai, kisi aur app ka nahi.

### Step 8: Dono servers restart karo

`.env` sirf server start hote waqt padhi jati hai. Terminal me `Ctrl+C` → phir se `npm run dev`.

---

## Part 2 — Cloudinary Keys

### Step 1: Account banao

https://cloudinary.com/users/register_free

- Google se sign up kar sakte ho (fast)
- "What describes you best?" → **Developer**
- Free plan: 25 GB storage + 25 GB bandwidth/month — is project ke liye bahut zyada hai

### Step 2: Dashboard kholo

Login ke baad seedha **Dashboard** khulta hai.
Agar na khule to left menu me **Programmable Media** → **Dashboard**.

### Step 3: Teen values dhundo

Dashboard par ek box hoga: **Product Environment Credentials** (ya **Account Details**)

```
Cloud name:   dxxxxxxxx
API Key:      123456789012345
API Secret:   ●●●●●●●●●●●●●●●●     ← "eye" icon ya "Reveal" dabao
```

**API Secret** by default chhupa hota hai — aankh wale icon par click karke dikhao, phir copy karo.

> Na mile to: upar right me ⚙️ **Settings** → **API Keys**

### Step 4: server/.env me daalo

```
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefgh_IJKLMNOP-qrstuvwx
```

⚠️ **Teeno sirf `server/.env` me jayengi.**
`client/.env` me **kabhi mat daalna** — `VITE_` wali saari values browser me sabko dikhti hain.
API Secret leak ho gaya to koi bhi tumhare account par kuch bhi upload kar sakta hai.

### Step 5: Server restart karo

---

## Sab kuch sahi hai ya nahi — check karo

Server restart karke browser me kholo:

```
http://localhost:5000/api/health
```

`"database":"connected"` aana chahiye.

Login test: `http://localhost:5173` → Login → Google → chat khul jaye.
Phir MongoDB Compass me apne `MONGO_URI` wale database (naam `.env` ki connection string ke aakhir me hai, jaise `vartalapah-chatting-webapp`) ke andar `users` collection me apna account dikhega.

---

## Common Errors

| Error | Kya karna hai |
|---|---|
| `Access blocked: Vartalapah has not completed verification` | Step 4 miss hua — apna email Test Users me add karo |
| `redirect_uri_mismatch` | JavaScript origins me `http://localhost:5173` daalo (`https` nahi, slash bina) |
| `The given origin is not allowed for the given client ID` | Origin add karne ke baad 2-3 minute lagte hain. Wait karo, phir hard refresh (Ctrl+Shift+R) |
| Google button dikh hi nahi raha | `client/.env` me Client ID khali hai, ya dev server restart nahi kiya |
| `Google login fail hua` | `client/.env` aur `server/.env` ki Client ID match nahi kar rahi |
| `Invalid Signature` (Cloudinary) | API Secret galat copy hua — dobara reveal karke copy karo |
| `Must supply api_key` | `server/.env` me Cloudinary values nahi hain, ya server restart nahi kiya |

---

## Yaad rakhna

- `.env` files **kabhi git me commit mat karna** — `.gitignore` me already hain
- `.env.example` git me jati hai (usme sirf placeholder hote hain)
- Client ID **public** hai, koi problem nahi
- Client Secret aur Cloudinary API Secret **kabhi frontend me mat daalna**
