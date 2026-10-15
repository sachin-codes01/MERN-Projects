const { sendMail, isMailConfigured, paragraph, C } = require("./mailer");

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

// Code bada aur saaf, bina box ke
const codeLine = (code) =>
  `<p style="margin:6px 0 18px;font-size:34px;font-weight:bold;letter-spacing:10px;color:${C.ink};font-family:'Courier New',monospace">${code}</p>`;

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
      text: `Your MDN verification code is ${code}. It expires in 10 minutes. Never share this code.`,
      preheader: `Your verification code is ${code}. It expires in 10 minutes.`,
      title: "Your verification code",
      footerNote: "You're receiving this email because this address was entered at checkout on the MDN website.",
      body: `${paragraph("Hi,")}
        ${paragraph("Use this code to verify your email address at checkout:")}
        ${codeLine(code)}
        ${paragraph("The code expires in 10 minutes. Please don't share it with anyone — MDN will never ask you for it.")}
        ${paragraph("If you didn't request this code, you can ignore this email.")}`,
    });
  }
  return { mode };
};

module.exports = { sendOtp, channelMode };
