// ==========================================================
// ERROR HANDLING MIDDLEWARE
// Ye dono server.js me SABSE AAKHIR me lagte hain - jab upar ka
// koi bhi route match nahi hota, tab inki baari aati hai
// ==========================================================

// Kisi bhi route se match nahi hua -> 404
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
}

// ==========================================================
// CENTRAL ERROR HANDLER
// Kisi bhi route me next(err) call ho to request yahan aati hai.
// Isi wajah se har route me sirf "next(err)" likhna kaafi hai -
// har jagah try/catch me alag alag res.status(500) nahi likhna padta
//
// Express ise error handler tabhi maanta hai jab iske 4 parameter hon
// (err sabse pehle) - isliye "next" use na hone par bhi likha hai
// ==========================================================
const errorHandler = (err, req, res, next) => {
  console.error('Server error:', err.message)

  res.status(err.status || 500).json({
    success: false,
    // Production me asli error message bahar nahi bhejte (security)
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  })
}

module.exports = { notFound, errorHandler }
