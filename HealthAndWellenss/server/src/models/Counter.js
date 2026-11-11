import mongoose from 'mongoose'

// Sequential IDs (SRSHWC-000001) ke liye counter — _id = "customer" / "appointment"
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
)

export default mongoose.model('Counter', counterSchema)
