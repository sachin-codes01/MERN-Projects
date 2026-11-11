import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { therapyUploadDirectory } from './services/therapyImages.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

// Express app yahan banta hai (server start index.js me hota hai)
const app = express()

// Render/Vercel jaise proxy ke peeche asli IP mile (rate limit ke liye zaroori)
app.set('trust proxy', 1)

// Sirf hamare frontend ko API call karne ki permission (comma se kai URLs de sakte ho)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((o) => o.trim())
app.use(cors({ origin: allowedOrigins }))

// Request body ka JSON padhne ke liye
app.use(express.json({ limit: '1mb' }))

// Saare API routes /api ke neeche
app.use('/api/media', express.static(therapyUploadDirectory, { dotfiles: 'deny', index: false, setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff') }))
app.use('/api', routes)

// Route na mile to 404, aur koi bhi error aaye to ek jaisa JSON response
app.use(notFound)
app.use(errorHandler)

export default app
