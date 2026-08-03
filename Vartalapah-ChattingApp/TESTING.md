# Vārtālāpaḥ — Testing Guide

Do tarah ki testing hai:

1. **Automated** — `npm test` (backend ki 53 checks apne aap chalti hain)
2. **Manual** — browser me karni padti hai (Google login, real-time, media, UI)

---

## 1. Automated API tests

**Terminal 1** — server chalu karo:
```bash
npm run dev --prefix D:\Programs\MERN-Projects\Vartalapah-ChattingApp\server
```

**Terminal 2** — tests chalao:
```bash
npm test --prefix D:\Programs\MERN-Projects\Vartalapah-ChattingApp\server
```

Aakhir me ye aana chahiye:
```
================  53 passed, 0 failed  ================
```

### Ye script kya karti hai

3 test users banati hai, unke JWT tokens khud sign karti hai (isliye Google login ki zarurat nahi padti), poori API test karti hai, aur aakhir me saara test data database se hata deti hai. Compass me koi kachra nahi bachta.

### Kya-kya check hota hai

| Section | Checks |
|---|---|
| Auth | valid token, invalid token, name validation |
| Users + search | apne aap ko list se nikalna, naam se search, regex-special characters se crash na hona |
| Private chat | message bhejna, khali message, bahut lamba message, khud ko message |
| Read receipts | pehle unread, chat kholne ke baad read |
| Tabs | Chats vs Requests ka logic |
| Edit / Unsend | apna message edit, **dusre ka message edit/delete nahi** |
| Block | dono taraf se rok, online status chhupna, unblock |
| Pin / Archive / Hide | flags lagna, naye message par apne aap un-hide hona |
| Groups | anjaan aadmi ko add na kar pana, admin-only rules, non-member ka access block |
| Unsend all | mere messages hatna, **uske messages bachna** |
| Upload | bina file ke reject |
| Delete account | token band, search se gayab, **dusre ki chat safe** |

---

## 2. Manual testing (browser me)

Do windows chahiye:
- **Window 1** — normal browser
- **Window 2** — incognito (`Ctrl+Shift+N`), alag Gmail se

> Dono Gmail Google Cloud Console ke **Test users** me add hone chahiye.

**Servers chalu karo:**
```bash
npm run dev --prefix D:\Programs\MERN-Projects\Vartalapah-ChattingApp\server
```
```bash
npm run dev --prefix D:\Programs\MERN-Projects\Vartalapah-ChattingApp\client
```

Phir `http://localhost:5173` kholo (`127.0.0.1` nahi — Google inhe alag maanta hai).

---

### A. Google login

- [ ] Home page khulta hai, "Get Started" dikhta hai
- [ ] Login page par "Sign in with Google" button
- [ ] Login karne par seedha `/chat` par pahunchte hain
- [ ] **F5 refresh** karo → logged in hi rehte ho (cookie)
- [ ] Logged in hote hue `/` kholo → seedha `/chat` par redirect
- [ ] Logout ke baad `/chat` kholo → `/login` par redirect
- [ ] Compass me `users` collection me account dikhta hai

### B. Users aur search

- [ ] "All people" tab me dusra account dikhta hai
- [ ] Search me naam type karo → filter hota hai
- [ ] Search me email type karo → filter hota hai
- [ ] Kuch bakwas type karo → "No results found"
- [ ] Har tab ka search alag hai (Chats me search karo → sirf chats me dhundta hai)

### C. Tabs aur badges

- [ ] Naya banda message kare → **Requests** tab par laal number aaye
- [ ] Uska message padho → number kam ho jaye
- [ ] Reply karo → wo banda **Requests se Chats** me chala jaye
- [ ] Naya user register kare → **All people** par number aaye
- [ ] All people tab kholo → number gayab

### D. Private chat + real-time

- [ ] Window 1 se message bhejo → Window 2 me **turant** dikhe (bina refresh)
- [ ] Window 1 type kare → Window 2 me "typing..." + bouncing dots
- [ ] Typing ruko → 1.5 second me indicator gayab
- [ ] Message par **ek tick** (✓)
- [ ] Window 2 chat khole → Window 1 ka tick **neela ✓✓**
- [ ] Window 2 ki chat band ho aur message aaye → sidebar me **violet unread badge**
- [ ] F5 refresh → saare messages wapas aayein

### E. Chat scroll (WhatsApp jaisa)

- [ ] Kam messages hon → wo **neeche** chipke hon, upar nahi
- [ ] Bahut saare messages hon → scrollbar aaye
- [ ] Chat kholte hi seedha sabse neeche (bina animation)
- [ ] Upar scroll karke purane messages padho → naya message aaye to **screen na hile**
- [ ] Neeche hote hue naya message aaye → smooth scroll ho

### F. Message CRUD

- [ ] Message par hover → ⋮ button aaye
- [ ] **Copy** → clipboard me aa jaye
- [ ] **Edit** → input me purana text, save par *edited* likha aaye
- [ ] Edit dusri window me bhi turant dikhe
- [ ] **Unsend** → confirm ke baad dono screens se gayab
- [ ] Unsend hone par sidebar ka preview bhi update ho
- [ ] **Dusre ke message par Edit/Unsend option na dikhe**

### G. Media

- [ ] 📷 → JPG/PNG chuno → preview + size dikhe → Send → dono screens par photo
- [ ] 🎥 → 10 sec se **choti** MP4 → Send → video player
- [ ] Upload ke waqt preview par loader
- [ ] Preview par ❌ → cancel ho jaye
- [ ] **10 sec se lambi video** → "Video must be 10 seconds or shorter"
- [ ] **20 MB se badi file** → "File must be smaller than 20 MB"
- [ ] **5 MB se badi image** → error
- [ ] PDF chuno → "Only JPG, PNG or WEBP images are allowed"
- [ ] Photo + text saath me bhejo → dono messages jayein
- [ ] Cloudinary → Media Library → `instachats/messages` folder me file dikhe
- [ ] Photo message unsend karo → **Cloudinary se bhi file gayab**

### H. Long press menu

- [ ] Chat list par **right-click** (desktop) ya **long press** (mobile) → menu khule
- [ ] **Pin** → banda sabse upar chala jaye, naam ke aage 📌
- [ ] **Archive** → neeche "Archived (1)" section me chala jaye
- [ ] Archived section par click → khul jaye
- [ ] **Remove from list** → list se hat jaye
- [ ] Wo banda dobara message kare → **apne aap wapas list me aa jaye**

### I. Block / Unblock

- [ ] View profile → **Block user**
- [ ] Input ki jagah message dikhe: "You blocked X..."
- [ ] Dusri window se message bhejne ki koshish → na jaye
- [ ] Online status aur last seen chhup jaye
- [ ] Typing indicator na dikhe
- [ ] **Unblock** → sab wapas normal

### J. Group chat

- [ ] Sidebar me **👥+** button
- [ ] Member picker me **sirf Chats/Requests wale log** dikhein (anjaan log nahi)
- [ ] Group name + photo + members chunkar **Create**
- [ ] Dusri window me group turant aaye + "You were added to..." toast
- [ ] Group me message bhejo → dusri window me **sender ke naam ke saath** turant dikhe
- [ ] Group me type karo → "X is typing..." dikhe
- [ ] Group me photo/video bhejo
- [ ] Group header dabao → **Group info** khule
- [ ] Members list me **Admin** chip dikhe
- [ ] Admin: naam badlo → Save → sabke sidebar me turant badle
- [ ] Admin: photo badlo
- [ ] Admin: member add karo (sirf chatted log dikhein)
- [ ] Admin: member remove karo → uske sidebar se group gayab
- [ ] **Non-admin window me Add button aur remove icons na dikhein**
- [ ] Non-admin: **Leave group** dikhe, Delete na dikhe
- [ ] Admin: **Delete group** → sabke sidebar se turant gayab

### K. Profile

- [ ] Sidebar me apni profile par click → My Profile khule
- [ ] Naam badlo → Save → sidebar me naya naam
- [ ] Compass me refresh → database me bhi naya naam
- [ ] Photo badlo → Save → Cloudinary par upload ho
- [ ] Email field disabled ho (Google se aata hai)
- [ ] **Log out** button kaam kare
- [ ] Dusre ki profile kholo → Block aur "Unsend all my messages" buttons

### L. Unsend all / Delete account

- [ ] View profile → **Unsend all my messages** → confirm
- [ ] **Mere saare messages** dono screens se gayab
- [ ] **Uske messages bache rahein**
- [ ] My Profile → **Delete my account** → confirm
- [ ] Home page par pahunch jao
- [ ] Dusri window me tumhara naam **"Deleted User"** ho jaye
- [ ] **Uski chat me tumhare purane messages bache rahein**
- [ ] Search me tum na milo
- [ ] Wahi Gmail se dobara login → **bilkul naya khali account**

### M. Online / offline

- [ ] Window 2 login kare → Window 1 me green dot aaye
- [ ] Window 2 **tab band** kare (logout nahi) → green dot hate, "Last seen just now"
- [ ] Window 2 do tabs khole, ek band kare → **abhi bhi online** dikhe

### N. Responsive (mobile)

Browser chhota karo ya F12 → mobile view:

- [ ] Sirf sidebar dikhe
- [ ] Chat par click → sidebar hide, chat full screen
- [ ] Back arrow (←) dikhe → wapas list
- [ ] Long press se menu khule

### O. Error handling

- [ ] Backend band karo → koi action karo → "Server se connection nahi ho pa raha" jaisa error
- [ ] Backend wapas chalao → app phir se kaam kare
- [ ] Internet band karke media upload → error dikhe, app crash na ho

---

## Common issues

| Problem | Fix |
|---|---|
| `Port 5000 already in use` | `npx kill-port 5000` |
| `Port 5173 is already in use` | `npx kill-port 5173` |
| Google button nahi dikhta | `client/.env` me Client ID daalo, dev server restart |
| `origin_mismatch` | URL me `localhost` use karo, `127.0.0.1` nahi |
| CORS error | Frontend 5173 par hi chalna chahiye |
| Real-time kaam nahi kar raha | Console me socket error dekho, dono servers chalu hain? |
| Cloudinary upload fail | `server/.env` me teeno keys sahi hain? Server restart kiya? |
