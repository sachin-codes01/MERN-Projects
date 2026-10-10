const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mdn-products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit", quality: "auto" }],
  },
});

// Cloudinary tak bhejne se PEHLE hi file type check — sirf asli images.
// (Route khud admin-only hai: adminRoutes me isAuth + isAdmin.)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error("Only JPG, PNG or WebP images can be uploaded"), { status: 400 }));
};

// 5 MB: phone se li product photos aksar 3-5 MB hoti hain (2 MB pe
// admin ko har photo pehle compress karni padti). Ek request me ek file.
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 } });

module.exports = upload;
