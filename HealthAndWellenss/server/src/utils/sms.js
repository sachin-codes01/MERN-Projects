import { httpError } from './httpError.js'

// Dev mode me OTP SMS ki jagah server console me print hota hai (aur screen pe dikhta hai)
export const isOtpDevMode = () => process.env.OTP_DEV_MODE === 'true'

// Production me OTP kabhi bhi response me nahi bhejna
export const showDevOtp = () => isOtpDevMode() && process.env.NODE_ENV !== 'production'

export const sendOtpSms = async (mobile, otp) => {
  if (isOtpDevMode()) {
    console.log(`[DEV OTP] +91 ${mobile} → ${otp}`)
    return
  }
  // Asli SMS ke liye yahan MSG91 / Fast2SMS / Twilio ka API call lagana hai
  // (unki API key .env me rakhna) — tab tak dev mode on rakho
  throw httpError(503, 'SMS service is not configured yet. Please contact the centre.')
}
