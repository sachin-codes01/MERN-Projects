const path = require("path");
const nodemailer = require("nodemailer");

// OTP bhejne wale "providers". Konsa channel chalu hai, env se tay hota hai:
//
//   Email: SMTP_USER + SMTP_PASS (Gmail App Password) set ho → asli email.
//   OTP_TEST_MODE=true → SMTP na ho to code server console me print
//                         (sirf local testing ke liye!).
//   Phone OTP hata diya gaya hai (SMS free nahi) — hamesha "off".
//
// Na provider, na test mode → channel band; checkout us OTP ko maangta hi nahi.

const testMode = () => process.env.OTP_TEST_MODE === "true";
const hasSmtp = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);
const channelMode = (channel) => {
  if (channel !== "email") return "off";
  if (hasSmtp()) return "live";
  return testMode() ? "test" : "off";
};

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Website ka logo — email ke andar hi attach (cid), taaki bina deploy
// ke bhi dikhe aur Gmail "images blocked" na kare
const LOGO_PATH = path.join(__dirname, "..", "assets", "mdn-logo-email.png");
const LOGO_CID = "mdn-logo@mdn";
const SITE_URL = (process.env.CLIENT_URL || "https://mdn-my-daily-nutrition.vercel.app").replace(/\/$/, "");

// Brand colours (website jaise): cream, olive green, orange
const C = { cream: "#fdf8f1", sand: "#f3ece0", green: "#3f5524", greenDark: "#2c3a14", orange: "#c2410c", ink: "#1f2a12", muted: "#6b6458", border: "#e8dfcf" };

// Email clients me CSS kam chalta hai — isliye tables + inline styles
const emailHtml = (code) => {
  const digits = String(code)
    .split("")
    .map(
      (d) => `<td style="padding:0 4px">
        <div style="width:44px;height:54px;line-height:54px;text-align:center;font-size:28px;font-weight:700;font-family:'Courier New',monospace;color:${C.greenDark};background:${C.cream};border:2px solid ${C.green};border-radius:10px">${d}</div>
      </td>`
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${C.sand}">
  <div style="display:none;max-height:0;overflow:hidden">Your MDN verification code is ${code}. It expires in 10 minutes.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};padding:32px 12px;font-family:Poppins,Segoe UI,Arial,sans-serif">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${C.border};box-shadow:0 6px 24px rgba(44,58,20,0.08)">

        <!-- Header: logo cream band par -->
        <tr><td align="center" style="background:${C.cream};padding:28px 24px 18px;border-bottom:3px solid ${C.green}">
          <a href="${SITE_URL}" style="text-decoration:none">
            <img src="cid:${LOGO_CID}" width="120" alt="MDN" style="display:block;width:120px;height:auto;border:0">
          </a>
          <div style="margin-top:8px;font-size:11px;letter-spacing:3px;font-weight:700;color:${C.greenDark}">MY DAILY NUTRITION</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:30px 28px 8px" align="center">
          <div style="font-size:11px;letter-spacing:2.5px;font-weight:700;color:${C.orange}">EMAIL VERIFICATION</div>
          <h1 style="margin:8px 0 10px;font-size:22px;line-height:1.3;color:${C.ink}">Confirm your email to place your order</h1>
          <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:${C.muted}">Enter this code on the checkout page:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>${digits}</tr></table>
          <p style="margin:22px 0 0;font-size:13px;color:${C.muted}">
            ⏱ This code expires in <strong style="color:${C.ink}">10 minutes</strong>.
          </p>
        </td></tr>

        <!-- Safety note -->
        <tr><td style="padding:22px 28px 26px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border:1px solid ${C.border};border-radius:12px">
            <tr><td style="padding:14px 16px;font-size:12.5px;line-height:1.6;color:${C.muted}">
              🔒 <strong style="color:${C.ink}">Never share this code.</strong> MDN will never ask for it by phone or chat.
              If you didn't request it, you can safely ignore this email.
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer: green band -->
        <tr><td align="center" style="background:${C.green};padding:18px 24px">
          <div style="font-size:13px;font-weight:700;color:#ffffff">Clean, tested supplements for every stage of your training.</div>
          <div style="margin-top:8px;font-size:12px">
            <a href="${SITE_URL}" style="color:#fdf8f1;text-decoration:underline">Visit store</a>
            <span style="color:#a8b590">&nbsp;·&nbsp;</span>
            <a href="${SITE_URL}/support" style="color:#fdf8f1;text-decoration:underline">Customer support</a>
          </div>
        </td></tr>
      </table>
      <div style="margin-top:14px;font-size:11px;color:${C.muted};font-family:Arial,sans-serif">© ${new Date().getFullYear()} MDN – My Daily Nutrition</div>
    </td></tr>
  </table>
</body></html>`;
};

// Code bhejo. { mode: "live" | "test" } lautata hai; band channel pe throw.
const sendOtp = async (channel, target, code) => {
  const mode = channelMode(channel);
  if (mode === "off") throw Object.assign(new Error(`${channel} verification is not available right now`), { status: 503 });

  if (mode === "test") {
    console.log(`\n[OTP TEST MODE] ${channel} ${target} → code ${code}\n`);
    return { mode };
  }

  if (channel === "email") {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || `"MDN – My Daily Nutrition" <${process.env.SMTP_USER}>`,
      to: target,
      subject: `${code} is your MDN verification code`,
      text: `Your MDN verification code is ${code}. It expires in 10 minutes.`,
      html: emailHtml(code),
      attachments: [{ filename: "mdn-logo.png", path: LOGO_PATH, cid: LOGO_CID }],
    });
  }
  return { mode };
};

module.exports = { sendOtp, channelMode };
