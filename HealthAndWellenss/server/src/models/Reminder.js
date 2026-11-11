import mongoose from 'mongoose'

// Follow-up reminders — visit complete hone pe apne aap banta hai, staff khud bhi bana sakta hai
const reminderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    type: { type: String, enum: ['follow-up', 'custom'], default: 'follow-up' },
    dueDate: { type: String, required: [true, 'Due date is required'] }, // YYYY-MM-DD
    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 500 },
    channel: { type: String, enum: ['whatsapp', 'sms', 'call'], default: 'whatsapp' },
    status: { type: String, enum: ['scheduled', 'sent', 'cancelled'], default: 'scheduled' },
    sentAt: Date,
    notifiedAt: Date, // customer ko in-app notification kab gayi (job dobara na bheje)
  },
  { timestamps: true },
)

reminderSchema.index({ status: 1, dueDate: 1 })

export default mongoose.model('Reminder', reminderSchema)
