import mongoose from 'mongoose'

// Discount offers — admin banata hai, eligible customer booking ke time use karta hai
const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Offer title is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    discountPercent: {
      type: Number,
      required: [true, 'Discount is required'],
      min: [1, 'Discount must be between 1 and 90%'],
      max: [90, 'Discount must be between 1 and 90%'],
    },
    validTill: { type: String, required: [true, 'Valid till date is required'] }, // YYYY-MM-DD
    minTier: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
    oncePerCustomer: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Offer', offerSchema)
