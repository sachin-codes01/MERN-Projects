const express = require('express')
const { protect } = require('../middleware/protect')
const {
  cloudinary,
  upload,
  uploadToCloudinary,
  IMAGE_TYPES,
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  MAX_VIDEO_SECONDS,
} = require('../config/cloudinary')

// ==========================================================
// UPLOAD ROUTE - /api/upload
//
// Sirf EK kaam: file leta hai -> Cloudinary par bhejta hai -> URL deta hai
// Cloudinary aur multer ki saari setting config/cloudinary.js me hai
// ==========================================================
const router = express.Router()

// ==========================================================
// POST /api/upload
// Milne wala URL frontend POST /api/messages me bhejta hai
// ==========================================================
router.post('/', protect, (req, res) => {
  // upload.single('file') ko manually call kar rahe hain taki
  // multer ke errors (file badi hai, galat type) ko khud handle kar sakein
  upload.single('file')(req, res, async (multerError) => {
    try {
      if (multerError) {
        // Multer ka apna code hota hai jab file limit se badi ho
        if (multerError.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File bahut badi hai (max ${MAX_VIDEO_MB} MB)`,
          })
        }
        return res.status(400).json({ success: false, message: multerError.message })
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file received' })
      }

      const { mimetype, size, buffer } = req.file
      const isImage = IMAGE_TYPES.includes(mimetype)

      // ---- IMAGE ka apna size check (5 MB) ----
      // Multer ki limit 20 MB thi (video ke liye), image ke liye alag se check karte hain
      if (isImage && size > MAX_IMAGE_MB * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `Image ${MAX_IMAGE_MB} MB se badi nahi honi chahiye`,
        })
      }

      // Cloudinary par upload
      const result = await uploadToCloudinary(buffer, {
        // Alag folder me rakhte hain taki Media Library me apni files pehchan sakein
        folder: 'instachats/messages',
        resource_type: isImage ? 'image' : 'video',
      })

      // ---- VIDEO ka duration check (max 10 second) ----
      // Duration file upload hone ke BAAD hi pata chalti hai,
      // isliye limit se lambi nikli to file wapas delete kar dete hain
      if (!isImage && result.duration > MAX_VIDEO_SECONDS) {
        await cloudinary.uploader.destroy(result.public_id, { resource_type: 'video' })

        return res.status(400).json({
          success: false,
          message: `Video ${MAX_VIDEO_SECONDS} second se lambi nahi honi chahiye (ye ${Math.round(result.duration)} second ki hai)`,
        })
      }

      res.json({
        success: true,
        mediaUrl: result.secure_url,
        mediaPublicId: result.public_id,
        messageType: isImage ? 'image' : 'video',
      })
    } catch (err) {
      console.error('Cloudinary upload error:', err.message)

      // Cloudinary ka andar wala error message bahar nahi bhejte (usme keys ka hint ho sakta hai)
      res.status(500).json({ success: false, message: 'Upload failed, please try again' })
    }
  })
})

module.exports = router
