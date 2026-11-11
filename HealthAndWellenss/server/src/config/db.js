import mongoose from 'mongoose'

// MongoDB se connect karta hai — connection fail ho to server band kar deta hai
// kyunki bina database ke API ka koi kaam nahi
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`)
    process.exit(1)
  }
}

export default connectDB
