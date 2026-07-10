exports.uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
  res.json({ success: true, url: req.file.path, publicId: req.file.filename });
};