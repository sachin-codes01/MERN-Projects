const User = require("../models/User");

// GET /api/users/me/addresses
exports.getMyAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");
  res.json({ success: true, data: user.addresses || [] });
};

// POST /api/users/me/addresses
exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const newAddress = req.body;

  if (newAddress.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  if (user.addresses.length === 0) newAddress.isDefault = true; // first address is default

  user.addresses.push(newAddress);
  await user.save();
  res.status(201).json({ success: true, data: user.addresses });
};

// PUT /api/users/me/addresses/:addressId
exports.updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ success: false, message: "Address not found" });

  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, req.body);
  await user.save();
  res.json({ success: true, data: user.addresses });
};

// DELETE /api/users/me/addresses/:addressId
exports.deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, data: user.addresses });
};