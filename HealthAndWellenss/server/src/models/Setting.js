import mongoose from 'mongoose'
import { SLOT_REGEX } from '../config/constants.js'

// Centre ki saari settings ek hi document me (_id: "centre") — admin panel se editable
const settingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'centre' },
    centreName: { type: String, trim: true, required: [true, 'Centre name is required'] },
    phone: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    openingHours: { type: String, trim: true, default: '' },
    timeSlots: {
      type: [{ type: String, match: [SLOT_REGEX, 'Time slots must look like 10:00 AM'] }],
      validate: [(v) => v.length > 0, 'Add at least one time slot'],
    },
    slotCapacity: { type: Number, min: [1, 'Slot capacity must be at least 1'], max: 50 },
    bookingWindowDays: { type: Number, min: [1, 'Booking window must be at least 1 day'], max: 90 },
    pointsPerVisit: { type: Number, min: 0, max: 1000 },
    pointValue: { type: Number, min: 0, max: 100 },
    followUpAfterDays: { type: Number, min: 1, max: 90 },
    silverVisits: { type: Number, min: 1 },
    goldVisits: { type: Number, min: 2 },
  },
  { timestamps: true },
)

export default mongoose.model('Setting', settingSchema)
