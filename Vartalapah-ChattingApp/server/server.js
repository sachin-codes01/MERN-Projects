const path = require('path')

// .env file ki values process.env me load kar deta hai
// Ye sabse upar hona chahiye, warna niche ki lines me values undefined aayengi
//
// path: __dirname isliye diya hai kyunki dotenv by default .env ko us folder me
// dhundta hai jahan se command chalayi gayi ho. Agar tum project root se
// "node server/server.js" chalao to .env nahi milega aur sab undefined aayega.
// __dirname hamesha isi file ka folder hai, isliye ab kahin se bhi chalao - chalega.
require('dotenv').config({ path: path.join(__dirname, '.env') })

const http = require('http')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const { connectDB } = require('./config/db')
const { initSocket } = require('./socket')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const { User, Group, Message } = require('./models')

const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const messagesRouter = require('./routes/messages')
const groupsRouter = require('./routes/groups')
const uploadRouter = require('./routes/upload')

// ==========================================================
// SERVER ENTRY FILE
//
// Is file ka kaam sirf itna hai:
//   1. middleware lagao
//   2. routes ko unke URL par mount karo
//   3. database se connect karke server start karo
//
// Asli kaam wala code alag folders me hai:
//   config/     -> database aur Cloudinary ka setup
//   models/     -> MongoDB ke schemas (User, Group, Message)
//   middleware/ -> protect (login check) aur error handling
//   routes/     -> asli API endpoints
//   socket/     -> Socket.IO (real-time)
//   utils/      -> chhote helpers jo kai jagah kaam aate hain
// ==========================================================
const app = express()

// Express ko seedha listen karane ki jagah ek HTTP server banate hain
// Kyunki Socket.IO ko bhi isi server par baithna hota hai
// Dono ek hi port (5000) share karte hain
const httpServer = http.createServer(app)

// ---------------- MIDDLEWARE ----------------

// CORS - browser by default alag port se request block karta hai
// Yahan sirf apne frontend (5173) ko allow kar rahe hain, sabko nahi
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Request body ka JSON parse karne ke liye
// limit isliye lagayi hai taki koi bahut bada payload bhejkar server na girae
app.use(express.json({ limit: '1mb' }))

// Cookies ko padhne ke liye - JWT token cookie me hi aata hai
// Iske bina req.cookies undefined rahega
app.use(cookieParser())

// ---------------- ROUTES ----------------

// Login / logout / apni profile - jaise POST /api/auth/google, GET /api/auth/me
app.use('/api/auth', authRouter)

// User list aur search - ye saare routes login ke bina nahi chalte
app.use('/api/users', usersRouter)

// Private aur group chat ke messages - bhejna, padhna, edit, delete
app.use('/api/messages', messagesRouter)

// Group banana, members add/remove, group settings
app.use('/api/groups', groupsRouter)

// Image/video Cloudinary par upload karne ke liye
app.use('/api/upload', uploadRouter)

// Health check - server chal raha hai ya nahi, ye check karne ke liye
app.get('/api/health', (req, res) => {
  // mongoose.connection.readyState: 1 = connected, 0 = disconnected
  const dbConnected = mongoose.connection.readyState === 1

  res.json({
    success: true,
    message: 'Vartalapah server is running', // API me plain ASCII rakha hai
    database: dbConnected ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  })
})

// Database me abhi kitna data hai - Compass ke bina bhi check kar sakte ho
app.get('/api/stats', async (req, res, next) => {
  try {
    const users = await User.countDocuments()
    const groups = await Group.countDocuments()
    const messages = await Message.countDocuments()

    res.json({ success: true, counts: { users, groups, messages } })
  } catch (err) {
    // Error ko error handler tak bhej dete hain
    next(err)
  }
})

// ---------------- ERROR HANDLING ----------------
// Ye dono SABSE AAKHIR me lagte hain - upar ke kisi route se
// match nahi hua tabhi inki baari aati hai
app.use(notFound)
app.use(errorHandler)

// ---------------- DATABASE + SERVER START ----------------

const PORT = process.env.PORT || 5000

const startServer = async () => {
  // Pehle database se connect - na ho to connectDB() wahin process band kar deta hai
  await connectDB()

  // Socket.IO ko HTTP server se jod dete hain
  initSocket(httpServer)
  console.log('[OK] Socket.IO ready')

  // Port pehle se busy ho to Node ek ugly crash deta hai
  // Isliye pehle hi pakad kar saaf message dikha dete hain
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[ERROR] Port ${PORT} pehle se use me hai`)
      console.error('   Matlab server ki ek copy already chal rahi hai.')
      console.error('   Purani band karne ke liye ye chalao:')
      console.error(`   npx kill-port ${PORT}`)
    } else {
      console.error('[ERROR] Server error:', err.message)
    }
    process.exit(1)
  })

  // Dhyan do: app.listen nahi, httpServer.listen - taki Socket.IO bhi chale
  httpServer.listen(PORT, () => {
    console.log(`[OK] Server chal raha hai: http://localhost:${PORT}`)
  })
}

startServer()
