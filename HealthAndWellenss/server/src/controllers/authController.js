import crypto from 'node:crypto'
import Customer, { toCustomerView } from '../models/Customer.js'
import Otp from '../models/Otp.js'
import { MOBILE_REGEX } from '../config/constants.js'
import { httpError } from '../utils/httpError.js'
import { signCustomerToken, signToken } from '../utils/token.js'
import { sendOtpSms, showDevOtp } from '../utils/sms.js'
import { tierFor } from '../services/settingsService.js'

const OTP_TTL_MS = 5 * 60 * 1000 // OTP 5 minute tak valid
const RESEND_COOLDOWN_MS = 30 * 1000 // dobara OTP 30 second baad
const MAX_ATTEMPTS = 5

// OTP ka hash — DB leak ho jaaye tab bhi asli OTP pata nahi chalega
const hashOtp = (otp) =>
  crypto.createHash('sha256').update(`${otp}:${process.env.JWT_SECRET}`).digest('hex')

const validateMobilePurpose = (mobile, purpose) => {
  if (!MOBILE_REGEX.test(mobile || '')) throw httpError(400, 'Enter a valid 10-digit mobile number')
  if (!['register', 'login'].includes(purpose)) throw httpError(400, 'Invalid request')
}

// POST /api/auth/otp/send — register ke liye naya number, login ke liye registered number
export const sendOtp = async (req, res) => {
  const { mobile, purpose } = req.body || {}
  validateMobilePurpose(mobile, purpose)

  const exists = await Customer.exists({ mobile })
  if (purpose === 'register' && exists) {
    throw httpError(409, 'This mobile number is already registered. Please log in instead.')
  }
  if (purpose === 'login' && !exists) {
    throw httpError(404, 'No account found with this mobile number. Please register first.')
  }

  const existing = await Otp.findOne({ mobile, purpose })
  if (existing) {
    const waitMs = RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())
    if (waitMs > 0) {
      throw httpError(429, `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting a new OTP.`)
    }
  }

  const otp = String(crypto.randomInt(100000, 1000000))
  await Otp.findOneAndUpdate(
    { mobile, purpose },
    {
      codeHash: hashOtp(otp),
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      lastSentAt: new Date(),
    },
    { upsert: true },
  )
  await sendOtpSms(mobile, otp)

  res.json({
    success: true,
    message: `OTP sent to +91 ${mobile}`,
    resendIn: RESEND_COOLDOWN_MS / 1000,
    ...(showDevOtp() && { devOtp: otp }),
  })
}

// POST /api/auth/otp/verify
// register → registrationToken (form complete karne ke liye), login → customer token
export const verifyOtp = async (req, res) => {
  const { mobile, purpose, otp } = req.body || {}
  validateMobilePurpose(mobile, purpose)
  if (!/^\d{6}$/.test(otp || '')) throw httpError(400, 'Please enter the 6-digit OTP')

  const record = await Otp.findOne({ mobile, purpose })
  if (!record || record.expiresAt < new Date()) {
    throw httpError(400, 'Your OTP has expired. Please request a new one.')
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne()
    throw httpError(429, 'Too many wrong attempts. Please request a new OTP.')
  }

  const matches = crypto.timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(hashOtp(otp)))
  if (!matches) {
    const updated = await Otp.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } }, { returnDocument: 'after' })
    const left = MAX_ATTEMPTS - (updated?.attempts ?? MAX_ATTEMPTS)
    throw httpError(400, left > 0 ? `Incorrect OTP. ${left} attempt${left > 1 ? 's' : ''} left.` : 'Too many wrong attempts. Please request a new OTP.')
  }

  // OTP ek hi baar use ho — do request ek saath aayein to sirf ek ko delete milega
  const { deletedCount } = await Otp.deleteOne({ _id: record._id })
  if (!deletedCount) throw httpError(400, 'This OTP has already been used. Please request a new one.')

  if (purpose === 'register') {
    return res.json({
      success: true,
      message: 'Mobile number verified',
      registrationToken: signToken({ mobile, purpose: 'register' }, '30m'),
    })
  }

  const customer = await Customer.findOne({ mobile })
  if (!customer?.isActive) throw httpError(403, 'Your account is inactive. Please contact the centre.')
  res.json({
    success: true,
    message: `Welcome back, ${customer.name.split(' ')[0]}!`,
    token: signCustomerToken(customer),
    customer: toCustomerView(customer, await tierFor(customer.visitsCount)),
  })
}
