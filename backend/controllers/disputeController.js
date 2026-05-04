const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { createError } = require('../utils/errorUtils');

const openDispute = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(createError(404, 'Order not found.'));

    const isParty = order.client.toString() === req.user._id.toString() || order.provider.toString() === req.user._id.toString();
    if (!isParty) return next(createError(403, 'Not authorized.'));

    const existing = await Dispute.findOne({ order: order._id });
    if (existing) return next(createError(409, 'A dispute already exists for this order.'));

    const dispute = await Dispute.create({ order: order._id, openedBy: req.user._id, reason: req.body.reason });

    await Notification.create({
      user: order.client.toString() === req.user._id.toString() ? order.provider : order.client,
      title: 'Dispute Opened',
      message: 'A dispute has been opened on your order.',
      type: 'dispute',
    });

    res.status(201).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

const getAdminDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const disputes = await Dispute.find(filter)
      .populate('order', 'status')
      .populate('openedBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: disputes.length, disputes });
  } catch (error) {
    next(error);
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { action, resolutionNote } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return next(createError(404, 'Dispute not found.'));
    if (dispute.status === 'resolved' || dispute.status === 'closed') return next(createError(400, 'Dispute is already resolved or closed.'));

    dispute.status = action === 'resolve' ? 'resolved' : 'closed';
    dispute.resolutionNote = resolutionNote;
    dispute.resolvedBy = req.user._id;
    await dispute.save();

    await AuditLog.create({
      actor: req.user._id,
      actionType: `dispute_${action}d`,
      targetType: 'Dispute',
      targetId: dispute._id,
      newValue: dispute.status,
    });

    res.status(200).json({ success: true, message: `Dispute ${action}d.`, dispute });
  } catch (error) {
    next(error);
  }
};

module.exports = { openDispute, getAdminDisputes, resolveDispute };
