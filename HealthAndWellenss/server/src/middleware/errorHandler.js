import { httpError } from '../utils/httpError.js'

// Jo route exist hi nahi karta uske liye 404
export const notFound = (req, res, next) => {
  next(httpError(404, `Route not found: ${req.originalUrl}`))
}

// Saare errors yahan aakar ek jaise JSON format me jaate hain
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500
  let message = err.message || 'Server error'
  let errors

  // Mongoose validation error (jaise required field missing) → 400, har field ka message alag
  if (err.name === 'ValidationError') {
    statusCode = 400
    errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]))
    message = Object.values(errors)[0]
  }

  // Galat MongoDB id (jaise /therapies/abc) → 400
  if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID'
  }

  // Unique field dobara (jaise same email) → 409
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'record'
    message = `This ${field} already exists`
  }

  // Token galat ya expire
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Your session has ended. Please log in again.'
  }

  // Galat JSON body
  if (err.type === 'entity.parse.failed') {
    statusCode = 400
    message = 'Invalid request data'
  }

  if (statusCode >= 500) console.error(err)

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Server error' : message,
    ...(errors && { errors }),
    // Development me stack dikhao taaki debug aasaan ho
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  })
}
