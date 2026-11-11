import 'dotenv/config'
import app from './app.js'
import connectDB from './config/db.js'
import { startReminderJob } from './jobs/reminderJob.js'

const PORT = process.env.PORT || 5000

// JWT_SECRET ke bina login kaam nahi karega — pehle hi bata do
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in server/.env')
  process.exit(1)
}

// Pehle database connect karo, phir server start, phir reminder job
const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    if (process.env.OTP_DEV_MODE === 'true') console.log('OTP dev mode is ON — OTPs are printed here')
  })
  startReminderJob()
}

start()
