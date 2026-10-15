const path = require("path");
const nodemailer = require("nodemailer");

// Saare emails (OTP, login, order…) yahin se jate hain — ek transporter,
// ek branded layout. SMTP (Gmail App Password) .env me na ho to email
// chupchaap skip, site ka koi kaam nahi rukta.

const isMailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Website ka logo — email ke andar attach (cid), taaki bina deploy ke bhi dikhe
const LOGO_PATH = path.join(__dirname, "..", "assets", "mdn-logo-email.png");
const LOGO_CID = "mdn-logo@mdn";
const SITE_URL = (process.env.CLIENT_URL || "https://mdn-my-daily-nutrition.vercel.app").replace(/\/$/, "");

// Brand colours (website jaise): cream, olive green, orange
const C = {
  cream: "#fdf8f1",
  sand: "#f3ece0",
  green: "#3f5524",
  greenDark: "#2c3a14",
  orange: "#c2410c",
  ink: "#1f2a12",
  muted: "#6b6458",
  border: "#e8dfcf",
};

// User ka likha text (naam, address, product name) HTML me safe
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* ---------- Chhote building blocks (templates inhe jodte hain) ---------- */

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto 4px"><tr>
    <td style="background:${C.green};border-radius:999px">
      <a href="${href}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${label}</a>
    </td>
  </tr></table>`;

const infoBox = (html) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;background:${C.cream};border:1px solid ${C.border};border-radius:12px">
    <tr><td style="padding:14px 16px;font-size:13px;line-height:1.6;color:${C.muted};text-align:left">${html}</td></tr>
  </table>`;

const paragraph = (html) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:${C.muted}">${html}</p>`;

/* ---------- Poora email: header (logo) + body + footer ---------- */

const layout = ({ preheader = "", eyebrow = "", title = "", body = "" }) => `<!doctype html>
<html><body style="margin:0;padding:0;background:${C.sand}">
  <div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};padding:32px 12px;font-family:Poppins,Segoe UI,Arial,sans-serif">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${C.border};box-shadow:0 6px 24px rgba(44,58,20,0.08)">
        <tr><td align="center" style="background:${C.cream};padding:28px 24px 18px;border-bottom:3px solid ${C.green}">
          <a href="${SITE_URL}" style="text-decoration:none">
            <img src="cid:${LOGO_CID}" width="120" alt="MDN" style="display:block;width:120px;height:auto;border:0">
          </a>
          <div style="margin-top:8px;font-size:11px;letter-spacing:3px;font-weight:700;color:${C.greenDark}">MY DAILY NUTRITION</div>
        </td></tr>
        <tr><td style="padding:30px 28px 28px" align="center">
          ${eyebrow ? `<div style="font-size:11px;letter-spacing:2.5px;font-weight:700;color:${C.orange}">${esc(eyebrow)}</div>` : ""}
          ${title ? `<h1 style="margin:8px 0 14px;font-size:22px;line-height:1.3;color:${C.ink}">${title}</h1>` : ""}
          ${body}
        </td></tr>
        <tr><td align="center" style="background:${C.green};padding:18px 24px">
          <div style="font-size:13px;font-weight:700;color:#ffffff">Clean, tested supplements for every stage of your training.</div>
          <div style="margin-top:8px;font-size:12px">
            <a href="${SITE_URL}" style="color:#fdf8f1;text-decoration:underline">Visit store</a>
            <span style="color:#a8b590">&nbsp;·&nbsp;</span>
            <a href="${SITE_URL}/orders" style="color:#fdf8f1;text-decoration:underline">Your orders</a>
            <span style="color:#a8b590">&nbsp;·&nbsp;</span>
            <a href="${SITE_URL}/support" style="color:#fdf8f1;text-decoration:underline">Customer support</a>
          </div>
        </td></tr>
      </table>
      <div style="margin-top:14px;font-size:11px;color:${C.muted};font-family:Arial,sans-serif">© ${new Date().getFullYear()} MDN – My Daily Nutrition</div>
    </td></tr>
  </table>
</body></html>`;

// Email bhejo (await karne layak). SMTP na ho to { skipped: true }.
const sendMail = async ({ to, subject, text, attachments = [], ...content }) => {
  if (!isMailConfigured() || !to) return { skipped: true };
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `"MDN – My Daily Nutrition" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html: layout(content),
    attachments: [{ filename: "mdn-logo.png", path: LOGO_PATH, cid: LOGO_CID }, ...attachments],
  });
  return { sent: true };
};

// Notification emails ke liye: request ko kabhi rokta ya fail nahi karta —
// background me bhejo, galti sirf log me
const sendInBackground = (label, buildAndSend) => {
  if (!isMailConfigured()) return;
  Promise.resolve()
    .then(buildAndSend)
    .catch((err) => console.error(`[email] ${label} failed:`, err.message));
};

module.exports = { sendMail, sendInBackground, isMailConfigured, layout, esc, button, infoBox, paragraph, C, SITE_URL };
