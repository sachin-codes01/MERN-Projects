import mongoose from 'mongoose'

// Har completed visit pe ek rating (appointment unique hai to dobara rating nahi)
const feedbackSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    therapyName: { type: String, default: '' },
    rating: {
      type: Number,
      required: [true, 'Please select a rating'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    isPublic: { type: Boolean, default: false }, // admin testimonial ke liye on kar sakta hai
  },
  { timestamps: true },
)

export default mongoose.model('Feedback', feedbackSchema)
