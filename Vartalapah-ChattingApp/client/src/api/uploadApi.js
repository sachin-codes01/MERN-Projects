import { requestUpload } from './httpClient.js'

// ==========================================================
// UPLOAD API - /api/upload
//
// ---- FILE KA POORA SAFAR ----
//   browser  ->  hamara backend  ->  Cloudinary  ->  URL wapas
//
// File seedha browser se Cloudinary par kyun nahi bhejte? Kyunki uske
// liye Cloudinary ki secret key browser me daalni padti - aur JavaScript
// me daali hui koi bhi cheez chhupi nahi rehti. Isliye file pehle
// hamare server par jati hai, wahan se Cloudinary par.
//
// Database me sirf URL aur publicId jate hain, file kabhi nahi
// ==========================================================
export const uploadApi = {
  // Wapas { mediaUrl, mediaPublicId, messageType } deta hai
  uploadFile: (file) => requestUpload(file),
}
