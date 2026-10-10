const nodemailer = require("nodemailer");

// OTP bhejne wale "providers". Konsa channel chalu hai, env se tay hota hai:
//
//   Email: SMTP_USER + SMTP_PASS (Gmail App Password) set ho → asli email.
//   Phone: abhi koi SMS provider nahi (free option nahi hai) — sirf test mode.
//   OTP_TEST_MODE=true → jis channel ka provider nahi, uska code server
//                         console me print (sirf local testing ke liye!).
//
// Na provider, na test mode → channel band; checkout us OTP ko maangta hi nahi.

const testMode = () => process.env.OTP_TEST_MODE === "true";
const hasSmtp = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);
// Baad me SMS provider (Firebase/MSG91…) jude to yahan true karo
const hasSms = () => false;

const channelMode = (channel) => {
  if (channel === "email" && hasSmtp()) return "live";
  if (channel === "phone" && hasSms()) return "live";
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

const emailHtml = (code) => `
  <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e5e0d6;border-radius:12px">
    <h2 style="margin:0 0 8px;color:#3f5524">MDN – My Daily Nutrition</h2>
    <p style="margin:0 0 16px;color:#333">Your verification code is:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:0 0 16px;color:#111">${code}</p>
    <p style="margin:0;color:#666;font-size:13px">It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
  </div>`;

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
    });
  }
  return { mode };
};

module.exports = { sendOtp, channelMode };
