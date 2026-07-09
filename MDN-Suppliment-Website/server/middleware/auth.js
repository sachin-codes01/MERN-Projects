const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies JWT and attaches user to req.user
exports.isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.isBlocked) {
      return res.status(401).json({ success: false, message: "Invalid or blocked user" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Restricts to admin/superadmin only — use AFTER isAuth
exports.isAdmin = (req, res, next) => {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin access only" });
  }
  next();
};

// Restricts to superadmin only — use AFTER isAuth
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Superadmin access only" });
  }
  next();
};