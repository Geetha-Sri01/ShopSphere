const orderService = require('../services/orderService');

async function placeOrder(req, res, next) {
  try {
    const {
      customerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      items
    } = req.body;

    // Field validations
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit Indian phone number is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'State is required' });
    }
    if (!pincode || pincode.replace(/\D/g, '').length !== 6) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit Indian PIN code is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
    }

    const order = await orderService.createOrder({
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      items
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Event dispatched to Kafka stream.',
      order
    });
  } catch (err) {
    if (err.message && err.message.includes('Insufficient stock')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  placeOrder,
  getOrder
};
