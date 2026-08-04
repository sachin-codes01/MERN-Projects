const mongoose = require('mongoose')

// ==========================================================
// MONGODB CONNECTION
// server.js sirf connectDB() bulata hai - connection ki saari
// tension (timeout, error ke hints) yahan alag rakhi hai
// ==========================================================
// Database ka naam MONGO_URI ke aakhir wale path se aata hai. Kisi bhi
// jagah purani URI (jaise .../instachats) reh jaye - Render ka env var,
// koi purana .env - to Atlas me chupchap ek aur khali database ban jata
// hai. Isliye naam yahan fix kar dete hain, URI par nahi chhodte
const DB_NAME = process.env.DB_NAME || 'vartalapah-chatting-webapp'

const connectDB = async () => {
  try {
    // serverSelectionTimeoutMS: 15 second me connect na ho to error do
    // Iske bina server chupchap hang hota rehta hai aur pata hi nahi chalta
    // dbName: URI me jo bhi likha ho, database yahi rahega
    await mongoose.connect(process.env.MONGO_URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 15000 })
    console.log('[OK] MongoDB connected:', mongoose.connection.name)
  } catch (err) {
    // MongoDB connect nahi hua to server chalane ka koi fayda nahi
    console.error('[ERROR] MongoDB connection failed:', err.message)

    // Common problems ka seedha hint de dete hain
    if (err.message.includes('querySrv')) {
      console.error('   DNS problem hai. Do fix:')
      console.error('   1) Apna DNS 8.8.8.8 / 1.1.1.1 kar do')
      console.error('   2) Atlas se non-SRV string lo (Connect > Drivers > version "2.2.12 or later")')
    } else if (err.message.includes('bad auth')) {
      console.error('   Username ya password galat hai. Atlas > Database Access me check karo.')
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('   Local MongoDB chal rahi hai? Services me "MongoDB" check karo.')
    } else {
      console.error('   Atlas > Network Access me apna IP allow kiya hai?')
    }

    process.exit(1)
  }
}

// Server chalne ke baad agar MongoDB ka connection toot jaye
mongoose.connection.on('disconnected', () => {
  console.warn('[WARN] MongoDB disconnected')
})

module.exports = { connectDB }
