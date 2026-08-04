const nodemailer = require('nodemailer')

// ==========================================================
// MAILER - SMTP se email bhejna (bilkul free)
//
// Koi paid email service (SendGrid/Mailgun) nahi chahiye - kisi bhi
// normal SMTP account se kaam ho jata hai. Sabse aasan Gmail hai:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=tumhara@gmail.com
//   SMTP_PASS=<16-akshar ka App Password>   <- normal Gmail password NAHI
//
// App Password Google Account -> Security -> 2-Step Verification ->
// App passwords se banta hai (2-Step ON hona zaroori hai). SETUP.md me
// poora tarika likha hai
// ==========================================================
const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''

// "From" me dikhne wala naam+email. Zyadatar SMTP servers (Gmail bhi)
// sirf apne hi account se bhejne dete hain, isliye default SMTP_USER hi hai
const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `Vartalapah <${SMTP_USER}>` : '')

// Teeno cheezein na hon to mail bhejna possible hi nahi
const isMailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)

const isProduction = process.env.NODE_ENV === 'production'

// "Vartalapah <abc@gmail.com>" me se sirf abc@gmail.com nikalta hai
const extractAddress = (value) => {
  const match = String(value).match(/<([^>]+)>/)
  return (match ? match[1] : String(value)).trim().toLowerCase()
}

// ---- SPAM SE BACHNE KA SABSE BADA NIYAM ----
// From wali email WAHI honi chahiye jis account se SMTP login kiya hai.
// Alag hui to SPF/DKIM "align" nahi hote - yaani receiving server
// (Gmail/Outlook) dekhta hai ki mail kisi aur ke naam se aaya hai
// lekin bheja kisi aur ne. Aisa mail seedha Spam me jata hai
//
// Isliye startup par hi cheekh kar bata dete hain - warna pata tab
// chalta jab users "code nahi aaya" bolna shuru karte
if (isMailConfigured && extractAddress(SMTP_FROM) !== SMTP_USER.trim().toLowerCase()) {
  console.warn(
    `[MAIL] Chetavni: SMTP_FROM (${extractAddress(SMTP_FROM)}) aur SMTP_USER (${SMTP_USER}) alag hain.\n` +
    '       Inka same hona zaroori hai, warna mails Spam folder me jayenge.'
  )
}

// Transporter ek hi baar banate hain aur wahi baar baar use hota hai -
// nodemailer andar hi connection pool sambhal leta hai. Har mail par
// naya banate to har baar SMTP handshake dobara hota (bahut dheera)
let transporter = null

const getTransporter = () => {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    // 465 = implicit TLS (shuru se hi encrypted), 587 = STARTTLS
    // (pehle plain, phir upgrade). Isliye secure sirf 465 par true
    //
    // 465 hi behtar hai: STARTTLS ka extra round-trip bachta hai, aur
    // Windows machines par 587 ka pehla connect aksar antivirus ke TLS
    // scan me phans jata hai (yahan naapa tha: 587 = 57s, 465 = 1.4s)
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },

    // ---- CONNECTION POOL ----
    // Bina pool ke har mail par poora naya connection banta hai: TCP +
    // TLS handshake + AUTH. Gmail par ye 10-20 second tak le sakta hai
    // (Windows antivirus TLS scan kare to aur bhi zyada) - user ko tab
    // tak sirf "Sending code..." dikhta rehta hai
    //
    // pool: true se ek hi connection khula rehta hai aur agle mails
    // usi par chale jate hain - pehle ke baad sab turant
    //
    // maxConnections 1: OTP ka traffic bahut kam hai, ek connection
    // kaafi hai. Zyada khole to Gmail "too many connections" deta hai
    pool: true,
    maxConnections: 1,

    // ---- TIMEOUTS ----
    // Inke bina nodemailer ka default intezaar bahut lamba hai. SMTP
    // settings galat hon ya port block ho, to request minute bhar
    // latki rehti hai aur user ko screen par bas "Sending code..."
    // dikhta rehta hai - na code, na error
    //
    // 10 second me haar maan lete hain: user ko turant saaf error
    // milta hai aur wo dobara koshish kar sakta hai
    connectionTimeout: 10000, // TCP connect
    greetingTimeout: 10000,   // server ka pehla jawab
    socketTimeout: 15000,     // connect hone ke baad chuppi
  })

  return transporter
}

// Dono flows (signup verify aur password reset) ka mail thoda alag
// padhna chahiye - baaki design ek jaisa hai
//
// Subject line jaan-boojhkar seedhi-saadi hai. Spam filters "FREE",
// "URGENT", "ACT NOW", saare CAPS aur bahut saare !!! par turant
// score badha dete hain - transactional mail me aisa kuch nahi hona chahiye
const MAIL_COPY = {
  register: {
    subject: 'Verify your email - Vartalapah',
    heading: 'Verify your email',
    line: 'Use this code to finish creating your Vartalapah account.',
  },
  reset: {
    subject: 'Your password reset code - Vartalapah',
    heading: 'Reset your password',
    line: 'Use this code to set a new password for your Vartalapah account.',
  },
}

// Bahut se email clients (Gmail included) <style> tags aur external CSS
// hata dete hain - isliye saara styling inline hai
//
// SPAM SE BACHAV, part 2 - is template me jaan-boojhkar ye NAHI hai:
//   - koi <img> (bahar se load hone wali image = tracking pixel ka shak)
//   - koi link/button (phishing filters links ko sabse zyada shak se dekhte hain,
//     aur short-links to lagbhag pakke spam hain). Code copy-paste karna
//     hi kaafi hai, click karne ki zarurat hi nahi rakhi
//   - koi attachment
const buildHtml = ({ heading, line, code, minutes }) => `
  <div style="margin:0;padding:24px;background:#0f0a1e;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:440px;margin:0 auto;background:#181129;border:1px solid #2c2044;border-radius:16px;padding:32px;">
      <p style="margin:0 0 24px;font-size:22px;font-weight:bold;color:#a78bfa;">Vartalapah</p>
      <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">${heading}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#b9b2c9;">${line}</p>
      <p style="margin:0 0 24px;padding:16px;background:#0f0a1e;border:1px solid #3b2b5c;border-radius:12px;text-align:center;font-size:30px;letter-spacing:10px;font-weight:bold;color:#ffffff;">${code}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#b9b2c9;">This code expires in ${minutes} minutes.</p>
      <p style="margin:0;font-size:13px;color:#7d7590;">If you did not request this, you can safely ignore this email.</p>
    </div>
  </div>
`

// Plain-text version bhi bhejte hain - kuch clients HTML dikhate hi
// nahi, aur spam filters bhi text-less mails ko shak se dekhte hain
const buildText = ({ heading, line, code, minutes }) =>
  `${heading}\n\n${line}\n\nCode: ${code}\n\nThis code expires in ${minutes} minutes.\nIf you did not request this, you can safely ignore this email.`

// ==========================================================
// sendOtpEmail - OTP wala mail bhejta hai
//
// SMTP configure hi nahi hai to:
//   development -> code seedha terminal par print kar dete hain, taaki
//                  bina kisi setup ke bhi poora flow test ho sake
//   production  -> error, kyunki wahan chupchaap "bhej diya" keh dena
//                  aur asal me na bhejna sabse bura hai
// ==========================================================
const sendOtpEmail = async ({ to, code, purpose, minutes }) => {
  const copy = MAIL_COPY[purpose] || MAIL_COPY.register

  if (!isMailConfigured) {
    if (isProduction) {
      throw new Error('SMTP is not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing)')
    }

    console.log(`\n[DEV MAIL] SMTP set nahi hai - ${purpose} OTP for ${to}: ${code} (${minutes} min)\n`)
    return
  }

  // Kitni der lagi - isse pata chalta hai ki der humare server (SMTP
  // handshake) me hai ya Gmail ke andar (delivery). Server 1-2 second
  // dikhaye lekin mail 2 minute baad pahunche, to wo Gmail ka hissa hai
  const startedAt = Date.now()

  await getTransporter().sendMail({
    from: SMTP_FROM,
    to,

    // Reply-To asli inbox par - "no-reply" jaisi jagah par jawab dena
    // possible na ho to filters usse thoda kam bharosemand maante hain
    replyTo: SMTP_USER,

    subject: copy.subject,

    // ---- SPAM SE BACHAV, part 3 ----
    // text aur html DONO bhejte hain. Sirf HTML wale mail ka spam score
    // apne aap zyada hota hai (asli log dono bhejte hain, spammers
    // aksar sirf HTML), aur kuch clients HTML dikhate hi nahi
    text: buildText({ ...copy, code, minutes }),
    html: buildHtml({ ...copy, code, minutes }),

    // Envelope ka "from" (SMTP MAIL FROM) hamesha wahi account jisse
    // login kiya hai - SPF isi address ko check karta hai, header wale
    // From ko nahi. Isse dono hamesha aligned rehte hain
    envelope: { from: SMTP_USER, to },

    headers: {
      // Ye mail machine ne bheja hai, kisi insaan ne nahi (RFC 3834).
      // Isse doosre servers iska auto-reply/out-of-office nahi bhejte -
      // warna wo bounce-loop bante hain jo sender ki reputation girate hain
      'Auto-Submitted': 'auto-generated',
    },
  })

  console.log(`[MAIL] ${purpose} code -> ${to} (${Date.now() - startedAt}ms)`)
}

// ==========================================================
// warmUpMailer - server start hote hi SMTP se ek baar baat kar lete hain
//
// Do fayde:
//   1. Pehla connection (TCP + TLS + AUTH) yahin ban jata hai. Pool ki
//      wajah se wahi khula rehta hai, isliye pehla ASLI code bhejne
//      wala user 20 second nahi rukta - usse ye kaam ho chuka milta hai
//   2. Galat App Password / block port ka pata ABHI chal jata hai,
//      startup par - na ki tab jab koi signup karne baithe
//
// Jaan-boojhkar await nahi karte aur fail hone par server band bhi nahi
// karte - baaki poora app (chat, messages) email ke bina theek chalta hai
// ==========================================================
// Gmail apne aap idle connection kuch minute baad band kar deta hai.
// Band hote hi agla mail phir se poora handshake karega - aur wahi
// 20-50 second wala intezaar wapas aa jayega
//
// Isliye har 4 minute me ek chhota sa verify() maar dete hain. Ye pool
// ka connection zinda rakhta hai, taaki asli mail hamesha "warm"
// connection par jaye. Kharcha na ke barabar hai - ek NOOP command
//
// 4 minute hi kyun? Kyunki nodemailer apna DNS result 5 minute cache
// karta hai. 4 par rakhne se wo cache bhi kabhi expire nahi hota - aur
// is machine par cold connect ka 10 second ka kharcha zyadatar DNS
// resolve me hi jata hai, TLS me nahi (dono ports par naap kar dekha)
const KEEPALIVE_MS = 4 * 60 * 1000

const warmUpMailer = () => {
  if (!isMailConfigured) {
    console.log('[MAIL] SMTP set nahi hai - codes terminal par print honge (sirf development me)')
    return
  }

  getTransporter().verify()
    .then(() => console.log(`[OK] SMTP ready: ${SMTP_USER}`))
    .catch((err) => console.error(`[MAIL] SMTP login fail: ${err.message}`))

  // Fail hone par chup rehte hain - agla mail waise bhi khud connect
  // karne ki koshish karega, aur uska error tab user tak pahunchta hai.
  // Yahan har 4 minute me terminal bharne ka koi fayda nahi
  const keepAlive = setInterval(() => {
    getTransporter().verify().catch(() => {})
  }, KEEPALIVE_MS)

  // unref: ye timer server ko zinda nahi rakhega. Iske bina Ctrl+C ke
  // baad bhi process latka rehta (aur npm test jaise scripts kabhi
  // khatam hi nahi hote)
  keepAlive.unref()
}

module.exports = { sendOtpEmail, warmUpMailer, isMailConfigured }
