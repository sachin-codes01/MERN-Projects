const Enquiry = require("../models/Enquiry");

// Normalises whatever the visitor typed into the bare 10 digits the model
// stores. Accepts "+91 98765 43210", "091-98765-43210", "9876543210" etc,
// then leaves the strict [6-9]\d{9} check to the schema validator so there
// is exactly one source of truth for what counts as valid.
function normalisePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

// POST /api/enquiries   (requires auth)
exports.createEnquiry = async (req, res) => {
  try {
    const { firstName, lastName, phone, subject, message } = req.body;

    const enquiry = await Enquiry.create({
      user: req.user._id,
      firstName,
      lastName,
      // Deliberately from the session, NOT req.body — see models/Enquiry.js.
      email: req.user.email,
      phone: normalisePhone(phone),
      subject: subject || "",
      message,
    });

    res.status(201).json({ success: true, data: enquiry });
  } catch (err) {
    // Mongoose validation errors (bad phone, missing message) are the
    // visitor's fault, not the server's — surface them as 400 so the form
    // can show the message inline instead of a generic failure.
    const status = err.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// PUT /api/enquiries/:id/channel   (requires auth)
// Called from the success screen when the visitor actually opens a chat.
exports.markChannelOpened = async (req, res) => {
  try {
    const { channel } = req.body;
    const enquiry = await Enquiry.findOne({ _id: req.params.id, user: req.user._id });
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });

    enquiry.openedChannel = channel || "";
    await enquiry.save();
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/enquiries   (admin only — mounted in adminRoutes)
exports.adminGetEnquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const enquiries = await Enquiry.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Enquiry.countDocuments(filter);
    res.json({ success: true, data: enquiries, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/enquiries/:id/status   (admin only)
exports.adminUpdateEnquiryStatus = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
