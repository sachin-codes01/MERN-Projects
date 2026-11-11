import mongoose from 'mongoose'

// In-app notifications (bell icon) — customer ke liye ya poore staff ke liye
const notificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ['customer', 'staff'], required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // audience=customer ho tab
    type: {
      type: String,
      enum: ['booking', 'cancellation', 'visit', 'reminder', 'offer', 'registration', 'feedback', 'system'],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // click karne pe kis page pe jaaye
    isRead: { type: Boolean, default: false }, // customer ke liye
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }], // staff ke liye (har staff ka alag)
  },
  { timestamps: true },
)

notificationSchema.index({ audience: 1, customer: 1, createdAt: -1 })
// 90 din purani notifications apne aap delete
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

export default mongoose.model('Notification', notificationSchema)
