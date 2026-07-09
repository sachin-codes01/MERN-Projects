const Order = require("../models/Order");

// GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: orders, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/orders/:id/status
// body: { orderStatus, trackingNumber, courierPartner, estimatedDelivery, deliveredAt, note }
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, courierPartner, estimatedDelivery, deliveredAt, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (orderStatus) {
      order.orderStatus = orderStatus;
      order.statusHistory.push({ status: orderStatus, note: note || "" });
    }

    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (courierPartner !== undefined) order.courierPartner = courierPartner;
    if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery;

    // Delivered date: admin can pick a date explicitly, or if they just
    // mark it "delivered" without choosing one, default to now.
    if (orderStatus === "delivered") {
      order.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date();
    } else if (deliveredAt !== undefined) {
      order.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};