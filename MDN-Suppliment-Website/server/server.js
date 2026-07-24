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

app.get("/", (req, res) => res.send("Supplement Store API running"));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});