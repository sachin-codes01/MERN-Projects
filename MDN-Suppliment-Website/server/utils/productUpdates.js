const crypto = require("crypto");

// "Naya product aaya" email ke saath jaane wala unsubscribe link. Link me
// user id + uska HMAC signature hota hai — koi doosre ka id daal ke kisi
// aur ko unsubscribe nahi kar sakta. Login ki zaroorat nahi (ek click).

const API_URL = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");

const sign = (userId) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(`product-emails:${userId}`).digest("hex").slice(0, 32);

const isValidSignature = (userId, sig) => {
  const expected = sign(userId);
  return typeof sig === "string" && sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

const unsubscribeUrl = (userId) => `${API_URL}/api/users/unsubscribe?u=${userId}&t=${sign(userId)}`;

module.exports = { unsubscribeUrl, isValidSignature };
