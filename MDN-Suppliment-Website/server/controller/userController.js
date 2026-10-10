const User = require("../models/User");

// Body pehle hi validate() se guzar chuka hai (validators/schemas.js
// addressBody) — sirf whitelisted, trimmed, checked fields aate hain.
// Fir bhi yahan naam se field uthaye jate hain, taaki schema me kabhi
// koi field jud bhi jaye to woh seedha address me na likh jaye.
const ADDRESS_KEYS = ["label", "fullName", "phone", "line1", "line2", "city", "district", "state", "pincode", "country"];
const pickAddress = (body) =>
  Object.fromEntries(ADDRESS_KEYS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

const MAX_ADDRESSES = 10;

// GET /api/users/me/addresses
exports.getMyAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");
  res.json({ success: true, data: user.addresses || [] });
};

// POST /api/users/me/addresses
exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= MAX_ADDRESSES) {
    return res.status(400).json({ success: false, message: `You can save up to ${MAX_ADDRESSES} addresses` });
  }

  const newAddress = pickAddress(req.body);
  // first address is always the default
  newAddress.isDefault = user.addresses.length === 0 || req.body.isDefault === true;
  if (newAddress.isDefault) user.addresses.forEach((a) => (a.isDefault = false));

  user.addresses.push(newAddress);
  await user.save();
  res.status(201).json({ success: true, data: user.addresses });
};

// PUT /api/users/me/addresses/:addressId
exports.updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ success: false, message: "Address not found" });

  if (req.body.isDefault === true) {
    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }
  Object.assign(address, pickAddress(req.body));
  await user.save();
  res.json({ success: true, data: user.addresses });
};

// DELETE /api/users/me/addresses/:addressId
exports.deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ success: false, message: "Address not found" });

  const wasDefault = address.isDefault;
  user.addresses.pull(address._id);
  // Default address hata to bacha hua pehla address default ban jaye
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  res.json({ success: true, data: user.addresses });
};
