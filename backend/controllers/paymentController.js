const Payment = require('../models/Payment');
const Order = require('../models/Order');
const GigPackage = require('../models/GigPackage');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { createError } = require('../utils/errorUtils');

const submitPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(createError(404, 'Order not found.'));
    if (order.client.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));
    if (order.status !== 'placed') return next(createError(400, `Payment can only be submitted on a placed order. Current: ${order.status}.`));

    const existing = await Payment.findOne({ order: order._id });
    if (existing) return next(createError(409, 'A payment record already exists for this order.'));

    const dupRef = await Payment.findOne({ transactionRef: req.body.transactionRef });
    if (dupRef) return next(createError(409, 'This transaction reference has already been used.'));

    const gigPkg = await GigPackage.findById(order.package).select('price');

    const payment = await Payment.create({
      order: order._id,
      amount: gigPkg.price,
      ...req.body,
    });

    order.status = 'payment_pending';
    await order.save();
    await OrderStatusHistory.create({ order: order._id, previousStatus: 'placed', newStatus: 'payment_pending', changedBy: req.user._id });

    await Notification.create({
      user: order.provider,
      title: 'Payment Submitted',
      message: 'A client has submitted payment proof for their order.',
      type: 'payment',
    });

    res.status(201).json({ success: true, message: 'Payment submitted. Awaiting admin verification.', payment });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(createError(404, 'Payment not found.'));
    if (payment.status !== 'pending') return next(createError(400, `Only pending payments can be actioned. Current: ${payment.status}.`));

    const order = await Order.findById(payment.order);
    if (!order) return next(createError(404, 'Associated order not found.'));

    if (action === 'verify') {
      payment.status = 'verified';
      order.status = 'payment_verified';
    } else {
      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason || null;
      order.status = 'placed';
    }

    await payment.save();
    await order.save();

    await OrderStatusHistory.create({
      order: order._id,
      previousStatus: 'payment_pending',
      newStatus: order.status,
      changedBy: req.user._id,
    });

    await AuditLog.create({
      actor: req.user._id,
      actionType: `payment_${action}d`,
      targetType: 'Payment',
      targetId: payment._id,
      oldValue: 'pending',
      newValue: payment.status,
    });

    await Notification.create({
      user: order.client,
      title: action === 'verify' ? 'Payment Verified' : 'Payment Rejected',
      message: action === 'verify'
        ? 'Your payment has been verified. The provider will start work soon.'
        : `Your payment was rejected. Reason: ${rejectionReason || 'No reason provided.'}`,
      type: 'payment',
    });

    res.status(200).json({ success: true, message: `Payment ${action}d.`, payment, order });
  } catch (error) {
    next(error);
  }
};

const getPendingPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate({
        path: 'order',
        populate: [
          { path: 'client', select: 'name email' },
          { path: 'gig', select: 'title' },
          { path: 'package', select: 'type price' },
        ],
      })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitPayment, verifyPayment, getPendingPayments };
