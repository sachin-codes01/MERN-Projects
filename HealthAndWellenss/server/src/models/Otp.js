import mongoose from 'mongoose'

// OTP ka hash (asli OTP kabhi save nahi hota) — expiresAt ke baad MongoDB khud delete kar deta hai
const otpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'login'], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true },
})

otpSchema.index({ mobile: 1, purpose: 1 }, { unique: true })
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)
