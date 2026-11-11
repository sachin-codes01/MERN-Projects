import mongoose from 'mongoose'
import { EMAIL_REGEX, MOBILE_REGEX } from '../config/constants.js'

// Customer (patient) — Compass me "customers" collection
const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true }, // SRSHWC-000001
    name: { type: String, required: [true, 'Full name is required'], trim: true, maxlength: 100 },
    dob: { type: String, required: [true, 'Date of birth is required'] }, // YYYY-MM-DD
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      match: [MOBILE_REGEX, 'Enter a valid 10-digit mobile number'],
    },
    address: { type: String, required: [true, 'Address is required'], trim: true, maxlength: 300 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      validate: [(v) => !v || EMAIL_REGEX.test(v), 'Please enter a valid email'],
    },
    wellness: {
      concern: { type: String, required: [true, 'Please select your main concern'], trim: true },
      bodyArea: { type: String, required: [true, 'Please select the affected body area'], trim: true },
      details: { type: String, trim: true, maxlength: 1000, default: '' },
      history: { type: String, trim: true, maxlength: 1000, default: '' },
    },
    consent: {
      privacy: { type: Boolean, required: true },
      followUp: { type: Boolean, default: false }, // WhatsApp/SMS follow-up
      promotional: { type: Boolean, default: false },
      acceptedAt: { type: Date },
    },
    visitsCount: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    lastVisitAt: { type: Date },
    staffNotes: { type: String, trim: true, maxlength: 2000, default: '' }, // sirf staff dekhta hai
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

customerSchema.index({ name: 'text' })

// Customer ko apne staffNotes nahi dikhne chahiye
export const toCustomerView = (customer, tier) => {
  const { staffNotes, __v, ...rest } = customer.toObject()
  return { ...rest, tier }
}

export default mongoose.model('Customer', customerSchema)
