// ==========================================================
// MEDIA RULES
//
// Ye rules teen jagah chahiye hote hain:
//   1. <input accept="..."> - file picker me sirf sahi files dikhein
//   2. validateMediaFile()  - user ko turant error dikhe
//   3. server (config/cloudinary.js) - asli rok, kyunki koi Postman
//      se seedha bhi bhej sakta hai
//
// Pehle teeno jagah MIME types alag alag likhe the. Ek naya format
// (jaise HEIC) support karna ho to teen jagah yaad rakhkar badalna
// padta - aur ek jagah bhoolna lagbhag pakka tha.
//
// Ab client ki dono jagah yahin se aati hain. Server ki apni copy
// isliye alag hai ki wo Node hai (ES module import nahi kar sakta),
// lekin values bilkul yahi hain
// ==========================================================

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export const MAX_IMAGE_MB = 5
export const MAX_VIDEO_MB = 20
export const MAX_VIDEO_SECONDS = 10

// MB ko bytes me badalne ke liye (1 MB = 1024 KB = 1024 * 1024 bytes)
export const BYTES_PER_MB = 1024 * 1024

// <input type="file"> ke accept attribute ki string.
// Upar wali list se BANTI hai, isliye dono kabhi alag nahi ho sakte
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(',')
export const MEDIA_ACCEPT = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES].join(',')
