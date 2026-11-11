import mongoose from 'mongoose'
import { EMAIL_REGEX } from '../config/constants.js'

// Staff / admin users — admin sab kuch control karta hai, staff daily kaam (appointments, customers)
const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Please enter a valid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
)

export default mongoose.model('Staff', staffSchema)
