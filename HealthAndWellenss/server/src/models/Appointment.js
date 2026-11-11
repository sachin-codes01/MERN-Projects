import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, unique: true }, // SRSHWC-APL-000001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    therapy: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapy', required: true },
    // Booking ke time ki therapy details ki copy — baad me price badle to purani booking na badle
    therapyName: { type: String, required: true },
    duration: { type: String, default: '' },
    date: { type: String, required: true }, // YYYY-MM-DD
    slot: { type: String, required: true }, // "10:00 AM"
    slotOrder: { type: Number, required: true }, // sorting ke liye minutes
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    therapist: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    bookedBy: { type: String, enum: ['customer', 'staff'], default: 'customer' },
    completedAt: Date,
    cancelledAt: Date,
    reminderNotifiedAt: Date, // "kal aapka appointment hai" wali notification ja chuki
    cancelledBy: { type: String, enum: ['customer', 'staff', ''], default: '' },
  },
  { timestamps: true },
)

appointmentSchema.index({ date: 1, slotOrder: 1 })
appointmentSchema.index({ customer: 1, date: -1 })
// Ek customer same date + slot pe do scheduled booking nahi kar sakta (double click se bhi nahi)
appointmentSchema.index(
  { customer: 1, date: 1, slot: 1 },
  { unique: true, partialFilterExpression: { status: 'scheduled' } },
)

export default mongoose.model('Appointment', appointmentSchema)
