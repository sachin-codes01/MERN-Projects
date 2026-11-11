import rateLimit from 'express-rate-limit'

const limiter = (max, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message },
  })

// OTP spam rokne ke liye: ek IP se 15 minute me 10 OTP request
export const otpLimiter = limiter(10, 'Too many OTP requests. Please try again in 15 minutes.')

// Password guess karne se rokne ke liye
export const loginLimiter = limiter(10, 'Too many login attempts. Please try again in 15 minutes.')
