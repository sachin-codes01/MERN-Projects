# Vārtālāpaḥ — Setup Guide

Teen cheezein chahiye: **Google** (sirf "Sign in with Google" button ke liye),
**Cloudinary** (photo/video store karne ke liye) aur ek **SMTP account**
(verification code wale email bhejne ke liye). Teeno bilkul free hain, credit
card nahi maangte.

> **Sirf password wala login chahiye, Google bilkul nahi?** To Part 1 skip kar
> sakte ho. Email ki malikiyat ab Google se nahi, email par bheje gaye 6-digit
> code se verify hoti hai (Part 3) - signup aur "Forgot password", dono me.
> Google Client ID ke bina bas "Sign in with Google" button gayab rahega,
> baaki app poori chalegi.

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

## Part 3 — SMTP (email par 6-digit code)

Signup aur "Forgot password" me email par **6-digit code** jata hai. Sahi code bharne
se hi saabit hota hai ki email tumhari hai. Koi paid service nahi chahiye — Gmail ka
SMTP free hai (roz ~500 mails).

### Step 1: 2-Step Verification ON karo

https://myaccount.google.com/security → **2-Step Verification** → ON

Ye zaroori hai. Iske bina App Password wala option dikhta hi nahi.

### Step 2: App Password banao

https://myaccount.google.com/apppasswords

- App ka naam: `Vartalapah`
- **Create** dabao
- 16 akshar ka password milega, jaise `abcd efgh ijkl mnop`

⚠️ Ye **apna normal Gmail password nahi hai**. Normal password SMTP me kaam
nahi karega — Google use turant reject kar deta hai.

### Step 3: server/.env me daalo

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tumhara.email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=Vartalapah <tumhara.email@gmail.com>
```

**Port 465 hi rakhna, 587 nahi.** Dono chalte hain, lekin 465 shuru se
encrypted hota hai jabki 587 pehle plain connect karke phir TLS par
upgrade karta hai (STARTTLS). Windows par wo upgrade wala step antivirus
ke TLS scan me phans jata hai — is machine par naap kar dekha:

| | Pehla connect | Baad wale |
|---|---|---|
| Port 587 | **57 second** | ~1.8s |
| Port 465 | **1.4 second** | ~2.3s |

`SMTP_PASS` me **spaces hata do** (Google spaces ke saath dikhata hai, lekin
paste karte waqt bina space ke hi daalna hai).

⚠️ `SMTP_FROM` wali email aur `SMTP_USER` wali email **same honi chahiye**.
Alag hui to mails seedha Spam me jayenge (wajah niche "Spam" section me).

### Step 4: Server restart karo

**SMTP daale bina bhi kaam chal jayega** — development me code seedha server ke
terminal par print ho jata hai:

```
[DEV MAIL] SMTP set nahi hai - register OTP for koi@email.com: 481902 (10 min)
```

Isse bina kisi setup ke poora signup/reset flow test kar sakte ho. Production
(`NODE_ENV=production`) me ye chhoot nahi milti — wahan SMTP na hone par saaf error aata hai.

---

## Code Spam me na jaye — iska dhyan rakha gaya hai

Code me pehle se:

- **From = SMTP_USER** — SPF/DKIM "align" hote hain. Alag hone par server startup
  par hi warning aa jati hai
- **Text + HTML dono** bhejte hain — sirf HTML wale mail ka spam score zyada hota hai
- **Koi link, koi image, koi attachment nahi** — phishing filters inhi teeno par sabse
  zyada shak karte hain. Code copy karna hi kaafi hai
- **Seedhi subject line** — `FREE`, `URGENT`, saare CAPS, `!!!` kuch nahi

Tumhare taraf se:

| Karo | Kyun |
|---|---|
| Pehla mail Spam me mile to **"Report not spam"** dabao | Gmail us sender ko aage se Inbox me rakhta hai |
| Sender ko **Contacts** me add kar lo | Contacts wale mails lagbhag kabhi spam nahi hote |
| Ek hi Gmail account se test karte raho | Naya account "warm up" nahi hota, uske mails zyada filter hote hain |
| Bahut zyada test mat karo | Roz ~500 se upar jaate hi Google account 24 ghante block kar deta hai |

Apna asli domain ho (jaise `mail.tumhara-domain.com`) to Brevo/Resend ka free
plan + SPF/DKIM records sabse best deliverability deta hai. Gmail SMTP chhote
projects aur college demo ke liye bilkul theek hai.

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
| `Could not send the verification email` | `SMTP_PASS` me App Password ki jagah normal Gmail password hai, ya `SMTP_HOST/PORT` galat |
| `Invalid login: 535-5.7.8 Username and Password not accepted` | App Password galat/purana hai — naya banao (spaces hata kar paste karo) |
| Code aaya hi nahi | Pehle **Spam folder** dekho. Server terminal par bhi dekho — SMTP set na ho to code wahin print hota hai |
| `Please wait 42s before requesting another code` | Ek email par har 60 second me ek hi code. Normal hai, ruk jao |
| `Too many verification emails requested` | Per-IP limit (15 min me 8 mails). Server restart karne se counter saaf ho jata hai — memory me hota hai |
| Code aane me 20-50 second lag rahe hain | `SMTP_PORT=465` karo (587 nahi). Terminal par `[MAIL] ... (842ms)` wala number batata hai der kahan hai |
| `This code has expired` | Code 10 minute chalta hai — **Resend code** dabao |

---

## Yaad rakhna

- `.env` files **kabhi git me commit mat karna** — `.gitignore` me already hain
- `.env.example` git me jati hai (usme sirf placeholder hote hain)
- Client ID **public** hai, koi problem nahi
- Client Secret aur Cloudinary API Secret **kabhi frontend me mat daalna**
