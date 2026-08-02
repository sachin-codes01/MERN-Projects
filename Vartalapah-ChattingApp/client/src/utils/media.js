// ==========================================================
// MEDIA RULES + VALIDATION
//
// Bilkul yahi rules backend (server/config/cloudinary.js) me bhi hain
// Frontend par isliye taki user ko turant feedback mile
// Backend par isliye kyunki koi Postman se seedha bhi bhej sakta hai
// ==========================================================
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_MB = 5

// Ye teen sirf isi file ke andar kaam aate hain, isliye export nahi kiye
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_VIDEO_MB = 20
const MAX_VIDEO_SECONDS = 10

// Video ki length pata karne ke liye ek temporary video element banate hain
// Browser metadata load karke duration bata deta hai
const getVideoDuration = (url) =>
  new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => resolve(video.duration)
    video.onerror = () => resolve(0)
    video.src = url
  })

// ==========================================================
// File select hone par saari validation ek jagah
// Sahi hai to { ok: true, ... } deta hai, warna { ok: false, error: '...' }
//
// Ek hi attach button hai (image aur video dono ke liye),
// isliye kind yahan file ke type se KHUD pata karte hain
// ==========================================================
export const validateMediaFile = async (file) => {
  const isImage = IMAGE_TYPES.includes(file.type)
  const isVideo = VIDEO_TYPES.includes(file.type)

  // 1) File type sahi hai ya nahi
  if (!isImage && !isVideo) {
    return {
      ok: false,
      error: 'Only JPG, PNG, WEBP images or MP4, WEBM, MOV videos are allowed',
    }
  }

  const kind = isImage ? 'image' : 'video'
  const maxMB = isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB

  // 2) File size limit se zyada to nahi
  // Image aur video ki limit alag hai (5 MB vs 20 MB)
  if (file.size > maxMB * 1024 * 1024) {
    return { ok: false, error: `${isImage ? 'Image' : 'Video'} must be smaller than ${maxMB} MB` }
  }

  // Browser me file ka temporary preview URL
  const url = URL.createObjectURL(file)

  // 3) Video ke liye duration bhi check karte hain (max 10 second)
  if (isVideo) {
    const duration = await getVideoDuration(url)

    if (duration > MAX_VIDEO_SECONDS) {
      // Preview URL ki memory wapas kar dete hain
      URL.revokeObjectURL(url)
      return { ok: false, error: `Video must be ${MAX_VIDEO_SECONDS} seconds or shorter` }
    }
  }

  return { ok: true, file, url, type: kind }
}

// ==========================================================
// Profile aur group photo ke liye chhota check
// (Sirf image chalti hai, video nahi - isliye alag function)
// ==========================================================
export const validateImageFile = (file, label) => {
  if (!IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: `${label} must be a JPG, PNG or WEBP image` }
  }

  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return { ok: false, error: `${label} must be smaller than ${MAX_IMAGE_MB} MB` }
  }

  return { ok: true }
}
