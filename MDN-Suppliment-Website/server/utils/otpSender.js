const { sendMail, isMailConfigured, paragraph, infoBox, C } = require("./mailer");

// OTP bhejne wale "providers". Konsa channel chalu hai, env se tay hota hai:
//
//   Email: SMTP_USER + SMTP_PASS (Gmail App Password) set ho → asli email.
//   OTP_TEST_MODE=true → SMTP na ho to code server console me print
//                         (sirf local testing ke liye!).
//   Phone OTP hata diya gaya hai (SMS free nahi) — hamesha "off".
//
// Na provider, na test mode → channel band; checkout us OTP ko maangta hi nahi.

const testMode = () => process.env.OTP_TEST_MODE === "true";
const hasSmtp = isMailConfigured;
const channelMode = (channel) => {
  if (channel !== "email") return "off";
  if (hasSmtp()) return "live";
  return testMode() ? "test" : "off";
};

// Code ke 6 digits alag-alag boxes me (email clients ke liye table)
const codeBoxes = (code) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>${String(code)
    .split("")
    .map(
      (d) => `<td style="padding:0 4px"><div style="width:44px;height:54px;line-height:54px;text-align:center;font-size:28px;font-weight:700;font-family:'Courier New',monospace;color:${C.greenDark};background:${C.cream};border:2px solid ${C.green};border-radius:10px">${d}</div></td>`
    )
    .join("")}</tr></table>`;

// Code bhejo. { mode: "live" | "test" } lautata hai; band channel pe throw.
const sendOtp = async (channel, target, code) => {
  const mode = channelMode(channel);
  if (mode === "off") throw Object.assign(new Error(`${channel} verification is not available right now`), { status: 503 });

  if (mode === "test") {
    console.log(`\n[OTP TEST MODE] ${channel} ${target} → code ${code}\n`);
    return { mode };
  }

  if (channel === "email") {
    await sendMail({
      to: target,
      subject: `${code} is your MDN verification code`,
      text: `Your MDN verification code is ${code}. It expires in 10 minutes.`,
      preheader: `Your MDN verification code is ${code}. It expires in 10 minutes.`,
      eyebrow: "EMAIL VERIFICATION",
      title: "Confirm your email to place your order",
      body: `${paragraph("Enter this code on the checkout page:")}
        ${codeBoxes(code)}
        <p style="margin:22px 0 0;font-size:13px;color:${C.muted}">⏱ This code expires in <strong style="color:${C.ink}">10 minutes</strong>.</p>
        ${infoBox(`🔒 <strong style="color:${C.ink}">Never share this code.</strong> MDN will never ask for it by phone or chat. If you didn't request it, you can safely ignore this email.`)}`,
    });
  }
  return { mode };
};

module.exports = { sendOtp, channelMode };
