const Order = require('../models/Order');
const Gig = require('../models/Gig');
const GigPackage = require('../models/GigPackage');
const Review = require('../models/Review');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const Notification = require('../models/Notification');
const { createError } = require('../utils/errorUtils');

const populateOrder = (order) =>
  order.populate([
    { path: 'client', select: 'name email avatar' },
    { path: 'provider', select: 'name email avatar' },
    { path: 'gig', select: 'title slug' },
    { path: 'package', select: 'type name price deliveryDays' },
  ]);

const recordStatusChange = async (orderId, previousStatus, newStatus, changedBy, note = null) => {
  await OrderStatusHistory.create({ order: orderId, previousStatus, newStatus, changedBy, note });
};

const placeOrder = async (req, res, next) => {
  try {
    const { gigId, packageId, requirements } = req.body;

    const gig = await Gig.findById(gigId);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.status !== 'active') return next(createError(400, 'Only active gigs can be ordered.'));
    if (gig.provider.toString() === req.user._id.toString()) return next(createError(400, 'You cannot order your own gig.'));

    const pkg = await GigPackage.findOne({ _id: packageId, gig: gigId });
    if (!pkg) return next(createError(404, 'Package not found for this gig.'));

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + pkg.deliveryDays);

    let order = await Order.create({
      client: req.user._id,
      provider: gig.provider,
      gig: gigId,
      package: packageId,
      requirements,
      deadline,
    });

    await recordStatusChange(order._id, null, 'placed', req.user._id);

    await Notification.create({
      user: gig.provider,
      title: 'New Order Received',
      message: `You have a new order for "${gig.title}".`,
      type: 'order',
      link: `/provider/orders/${order._id}`,
    });

    order = await populateOrder(order);
    res.status(201).json({ success: true, message: 'Order placed successfully.', order });
  } catch (error) {
    next(error);
  }
};

const getClientOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { client: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('provider', 'name avatar')
        .populate('gig', 'title slug')
        .populate('package', 'type name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    const orderIds = orders.map((o) => o._id);
    const reviews = await Review.find({ order: { $in: orderIds } }).select('order');
    const reviewedSet = new Set(reviews.map((r) => r.order.toString()));

    const ordersWithReview = orders.map((o) => {
      const obj = o.toJSON();
      obj.hasReview = reviewedSet.has(o._id.toString());
      return obj;
    });

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: orders.length,
      orders: ordersWithReview,
    });
  } catch (error) {
    next(error);
  }
};

const getProviderOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { provider: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('client', 'name avatar')
        .populate('gig', 'title slug')
        .populate('package', 'type name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const startOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found.'));
    if (order.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));

    const startableStatuses = ['payment_verified', 'revision_requested'];
    if (!startableStatuses.includes(order.status)) {
      return next(createError(400, `Order must be payment_verified or revision_requested to start. Current: ${order.status}.`));
    }

    const prev = order.status;
    order.status = 'in_progress';
    await order.save();
    await recordStatusChange(order._id, prev, 'in_progress', req.user._id);

    await Notification.create({
      user: order.client,
      title: prev === 'revision_requested' ? 'Revision In Progress' : 'Work Started',
      message: prev === 'revision_requested'
        ? 'The provider has started working on your requested revision.'
        : 'The provider has started working on your order.',
      type: 'order',
      link: `/client/orders/${order._id}`,
    });

    order = await populateOrder(order);
    res.status(200).json({ success: true, message: 'Order is now in progress.', order });
  } catch (error) {
    next(error);
  }
};

const deliverOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found.'));
    if (order.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));
    if (order.status !== 'in_progress') return next(createError(400, `Order must be in_progress to deliver. Current: ${order.status}.`));

    const prev = order.status;
    order.status = 'delivered';
    await order.save();
    await recordStatusChange(order._id, prev, 'delivered', req.user._id);

    await Notification.create({
      user: order.client,
      title: 'Order Delivered',
      message: 'The provider has delivered your order. Please review and accept or request a revision.',
      type: 'order',
      link: `/client/orders/${order._id}`,
    });

    order = await populateOrder(order);
    res.status(200).json({ success: true, message: 'Order marked as delivered.', order });
  } catch (error) {
    next(error);
  }
};

const requestRevision = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found.'));
    if (order.client.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));
    if (order.status !== 'delivered') return next(createError(400, 'Can only request revision on a delivered order.'));

    const prev = order.status;
    order.status = 'revision_requested';
    await order.save();
    await recordStatusChange(order._id, prev, 'revision_requested', req.user._id, req.body.note);

    await Notification.create({
      user: order.provider,
      title: 'Revision Requested',
      message: 'The client has requested a revision on their order.',
      type: 'order',
      link: `/provider/orders/${order._id}`,
    });

    order = await populateOrder(order);
    res.status(200).json({ success: true, message: 'Revision requested.', order });
  } catch (error) {
    next(error);
  }
};

const completeOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found.'));
    if (order.client.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));
    if (order.status !== 'delivered') return next(createError(400, 'Can only complete a delivered order.'));

    const prev = order.status;
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();
    await recordStatusChange(order._id, prev, 'completed', req.user._id);

    await Gig.findByIdAndUpdate(order.gig, { $inc: { totalOrders: 1 } });

    await Notification.create({
      user: order.provider,
      title: 'Order Completed',
      message: 'The client has marked the order as complete.',
      type: 'order',
      link: `/provider/orders/${order._id}`,
    });

    order = await populateOrder(order);
    res.status(200).json({ success: true, message: 'Order completed.', order });
  } catch (error) {
    next(error);
  }
};

const getOrderStatusHistory = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, 'Order not found.'));

    const isOwner =
      order.client.toString() === req.user._id.toString() ||
      order.provider.toString() === req.user._id.toString();
    const isStaff = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isStaff) return next(createError(403, 'Not authorized.'));

    const history = await OrderStatusHistory.find({ order: req.params.id })
      .populate('changedBy', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};

const adminGetAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('client', 'name email')
        .populate('provider', 'name email')
        .populate('gig', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeOrder,
  getClientOrders,
  getProviderOrders,
  startOrder,
  deliverOrder,
  requestRevision,
  completeOrder,
  getOrderStatusHistory,
  adminGetAllOrders,
};
