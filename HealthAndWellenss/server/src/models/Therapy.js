import mongoose from 'mongoose'
import { validTherapyImage } from '../services/therapyImages.js'

// Therapy / service jo centre deta hai — admin panel se add/edit hoti hai
const therapySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Therapy name is required'], trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 2000 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    durationMin: { type: Number, required: [true, 'Duration is required'], min: 5 },
    durationMax: {
      type: Number,
      required: [true, 'Duration is required'],
      validate: [(v) => v >= 5, 'Duration must be at least 5 minutes'],
    },
    areas: { type: [String], default: [] }, // Neck, Shoulders, Back...
    image: { type: String, trim: true, default: '' }, // photo ka URL
    images: { type: [String], default: [], validate: [v => v.length <= 12 && v.every(validTherapyImage), 'Add up to 12 valid gallery image URLs'] },
    order: { type: Number, default: 0 }, // list me kis number pe dikhe
    isActive: { type: Boolean, default: true }, // false = website pe hidden
  },
  { timestamps: true },
)

export default mongoose.model('Therapy', therapySchema)
