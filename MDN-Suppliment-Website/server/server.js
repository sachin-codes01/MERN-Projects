require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./database");
const { rejectMongoOperators, corsOptions } = require("./middleware/security");
const { hideServerErrorDetails, notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const pincodeRoutes = require("./routes/pincodeRoutes");
const otpRoutes = require("./routes/otpRoutes");

const app = express();

// Render/Vercel proxy ke peeche — asli client IP (rate limit ke liye) X-Forwarded-For se
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));

// JSON body ki size limit — chhoti rakhi hai taaki koi bada payload bhej ke
// server ko hila na sake. Admin product form (lambe descriptions) ko 1 MB.
// Pehla matching parser body padh leta hai; baad wale use chhod dete hain.
app.use(
  "/api/orders/razorpay-webhook",
  express.json({
    limit: "200kb",
    // Razorpay signs the webhook's exact bytes, so the raw body has to be
    // kept for that one route — re-serialising the parsed JSON would not
    // reproduce them and every signature check would fail.
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);
app.use("/api/admin", express.json({ limit: "1mb" }));
app.use(express.json({ limit: "10kb" }));

app.use(rejectMongoOperators);
app.use(hideServerErrorDetails);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/pincodes", pincodeRoutes);
app.use("/api/otp", otpRoutes);

app.get("/", (req, res) => res.send("Supplement Store API running"));

// Unmatched /api/* routes — JSON 404 (api.js hamesha JSON expect karta hai)
app.use("/api", notFound);

// Har error ka ek hi shape: { success: false, message, errors? }
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});