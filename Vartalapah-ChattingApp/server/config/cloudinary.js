const multer = require('multer')
const cloudinary = require('cloudinary').v2

// ==========================================================
// CLOUDINARY + MULTER SETUP
//
// Photos aur videos database me NAHI rakhte - MongoDB me sirf
// unka URL jata hai. Asli file Cloudinary par rehti hai
//
// Keys .env se aati hain - code me kabhi likhni nahi chahiye
// Ye SIRF backend par hai, frontend ko secret kabhi nahi jata
// ==========================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // hamesha https URL do
})

// ---------- RULES (bilkul yahi rules frontend par bhi hain) ----------
// Frontend par isliye taki user ko turant feedback mile,
// yahan isliye kyunki koi Postman se seedha bhi bhej sakta hai
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_MB = 5
const MAX_VIDEO_MB = 20
const MAX_VIDEO_SECONDS = 10

// ==========================================================
// MULTER - file upload handle karta hai
// memoryStorage matlab file disk par save nahi hoti, RAM me rehti hai
// Wahan se seedha Cloudinary chali jati hai - server par kachra nahi bachta
// ==========================================================
const upload = multer({
  storage: multer.memoryStorage(),

  // Sabse badi limit yahan lagate hain (video ki 20 MB)
  // Iske upar ki file to multer padhegi hi nahi - server ki memory bachti hai
  limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },

  // Galat type ki file yahin reject ho jati hai
  fileFilter: (req, file, cb) => {
    if ([...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG, WEBP images or MP4, WEBM, MOV videos are allowed'))
    }
  },
})

// Buffer (RAM wali file) ko Cloudinary par bhejne ka helper
// Cloudinary ka upload_stream callback style me kaam karta hai,
// isliye use Promise me wrap kar rahe hain taki await use kar sakein
const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })

    stream.end(buffer)
  })

// Message ya group delete hone par uski media bhi Cloudinary se hata dete hain
const deleteFromCloudinary = async (publicId, messageType) => {
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: messageType === 'video' ? 'video' : 'image',
    })
  } catch (err) {
    // Cloudinary se delete fail ho jaye to bhi message to delete hona hi chahiye
    console.error('Cloudinary delete error:', err.message)
  }
}

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  IMAGE_TYPES,
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  MAX_VIDEO_SECONDS,
}
