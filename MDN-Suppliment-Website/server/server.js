require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes"); // ADD THIS
const settingsRoutes = require("./routes/settingsRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");

const app = express();
app.use(express.json({ limit: "15mb" }));

// Vite bumps to the next free port (5174, 5175, ...) whenever 5173 is
// already taken, so pinning CORS to just :5173 silently breaks the site
// on every other port — requests get blocked with no visible error and
// pages relying on the API (e.g. product sections) just render empty.
// Any localhost port is allowed here since this only affects local dev.
const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;
const ALLOWED_ORIGINS = ["https://mdn-my-daily-nutrition.vercel.app"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || LOCALHOST_ORIGIN.test(origin) || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes); // ADD THIS
app.use("/api/settings", settingsRoutes);
app.use("/api/enquiries", enquiryRoutes);

app.get("/", (req, res) => res.send("Supplement Store API running"));

// Unmatched /api/* routes — without this Express falls through to its
// default HTML 404 page, which breaks client/src/api/api.js's `res.json()`
// parse (it always expects the {success, message} JSON shape).
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Catch-all error handler — must be registered last (4 args is how Express
// recognizes an error middleware). Without this, an error thrown outside a
// controller's own try/catch (e.g. a sync throw, a rejected promise in
// middleware) falls through to Express's default HTML error page instead
// of the JSON shape the frontend expects.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});