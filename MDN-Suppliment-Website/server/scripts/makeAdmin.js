require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User"); // adjust path to your User model

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node makeAdmin.js someone@email.com");
    process.exit(1);
  }
  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true }
  );
  console.log(user ? `${email} is now admin` : "User not found");
  process.exit(0);
}

run();





// node scripts/makeAdmin.js redmoon28022005@gmail.com