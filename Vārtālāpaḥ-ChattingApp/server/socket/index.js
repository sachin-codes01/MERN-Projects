const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { User, Group } = require('../models')
const { isBlockedBetween } = require('../utils/relations')
const { COOKIE_NAME } = require('../utils/token')

// io ko baaki files (jaise routes/messages.js) me bhi chahiye hota hai
// isliye ise yahan rakhkar getIO() se bahar dete hain
let io = null

// Cookie header ek lambi string hoti hai: "a=1; b=2; token=xyz"
// Usme se apna token nikalne ka chhota helper
const getTokenFromCookie = (cookieHeader) => {
  if (!cookieHeader) return null

  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) return rest.join('=')
  }

  return null
}

// ==========================================================
// SOCKET.IO SETUP
// server.js se ye function call hota hai
// ==========================================================
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true, // cookie bhejne ke liye zaroori
    },
  })

  // ---------- SOCKET AUTHENTICATION ----------
  // Ye har naye connection se PEHLE chalta hai
  // Jo login nahi hai use socket connect hi nahi karne dete
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromCookie(socket.handshake.headers.cookie)
      if (!token) return next(new Error('Please log in first'))

      // Wahi JWT jo REST APIs me use hota hai
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('name email profileImage')
      if (!user) return next(new Error('User not found'))

      // User ki info socket par chipka dete hain, aage har event me kaam aayegi
      socket.userId = user._id.toString()
      socket.userName = user.name

      next()
    } catch (err) {
      next(new Error('Session expired, please log in again'))
    }
  })

  // ---------- CONNECTION ----------
  io.on('connection', async (socket) => {
    console.log('[SOCKET] connected:', socket.userName)

    // socket.join() -> user ko apne naam ka "room" me daal dete hain
    // Room ka naam = user ki id
    // Isse baad me io.to(userId).emit() karke SIRF usi user ko message bhej sakte hain
    socket.join(socket.userId)

    // Apne saare groups ke rooms me bhi join kar lo
    // Warna group ke live messages nahi milenge
    // Room ka naam "group:<id>" hai - user ke room (sirf id) se alag rakhne ke liye
    const myGroups = await Group.find({ members: socket.userId }).select('_id').lean()
    myGroups.forEach((g) => socket.join(`group:${g._id}`))

    // Database me online mark karo
    await User.findByIdAndUpdate(socket.userId, { isOnline: true })

    // socket.broadcast.emit -> sabko bhejo, LEKIN khud ko nahi
    socket.broadcast.emit('user-status', { userId: socket.userId, isOnline: true })

    // Naye user ko batao ki abhi kaun kaun online hai
    // io.sockets.sockets ek Map hai jisme saare connected sockets hote hain
    const onlineIds = []
    for (const [, s] of io.sockets.sockets) {
      if (s.userId) onlineIds.push(s.userId)
    }
    socket.emit('online-users', onlineIds)

    // ---------- TYPING INDICATOR ----------
    // socket.on() -> client se aane wale event ko sunte hain
    // io.to(room).emit() -> us room me event bhejte hain
    socket.on('typing', async ({ receiverId, groupId }) => {
      // Group me typing -> group ke room me bhejo, lekin khud ko nahi
      if (groupId) {
        return socket.to(`group:${groupId}`).emit('typing', {
          userId: socket.userId,
          userName: socket.userName,
          groupId,
        })
      }

      if (!receiverId) return

      // Block hai to typing bhi nahi dikhni chahiye
      // (frontend har keystroke par nahi, ~1 second me ek baar hi emit karta hai,
      //  isliye ye database check bar-bar nahi chalta)
      if (await isBlockedBetween(socket.userId, receiverId)) return

      io.to(receiverId).emit('typing', { userId: socket.userId })
    })

    socket.on('stop-typing', ({ receiverId, groupId }) => {
      if (groupId) {
        return socket.to(`group:${groupId}`).emit('stop-typing', {
          userId: socket.userId,
          groupId,
        })
      }

      if (!receiverId) return
      io.to(receiverId).emit('stop-typing', { userId: socket.userId })
    })

    // ---------- DISCONNECT ----------
    // Tab band karne par ye apne aap chalta hai - isiliye online status sach me sahi rehta hai
    socket.on('disconnect', async () => {
      console.log('[SOCKET] disconnected:', socket.userName)

      // Ek user kai tabs khol sakta hai
      // Saare tabs band hone par hi offline karte hain
      const stillConnected = [...io.sockets.sockets.values()].some(
        (s) => s.userId === socket.userId
      )

      if (!stillConnected) {
        const lastSeen = new Date()
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen })
        io.emit('user-status', { userId: socket.userId, isOnline: false, lastSeen })
      }
    })
  })

  return io
}

// routes/messages.js jaisi files isse io lekar real-time events bhejti hain
const getIO = () => io

module.exports = { initSocket, getIO }
