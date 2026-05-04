const Review = require('../models/Review');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const ProviderProfile = require('../models/ProviderProfile');
const { createError } = require('../utils/errorUtils');

const createReview = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(createError(404, 'Order not found.'));
    if (order.client.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));
    if (order.status !== 'completed') return next(createError(400, 'Can only review a completed order.'));

    const existing = await Review.findOne({ order: order._id });
    if (existing) return next(createError(409, 'You have already reviewed this order.'));

    const review = await Review.create({
      order: order._id,
      client: req.user._id,
      provider: order.provider,
      gig: order.gig,
      ...req.body,
    });

    const allReviews = await Review.find({ gig: order.gig });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Gig.findByIdAndUpdate(order.gig, {
      ratingAvg: Math.round(avg * 10) / 10,
      totalReviews: allReviews.length,
    });

    const providerReviews = await Review.find({ provider: order.provider });
    const providerAvg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    await ProviderProfile.findOneAndUpdate(
      { user: order.provider },
      { rating: Math.round(providerAvg * 10) / 10 }
    );

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

const getGigReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ gig: req.params.gigId })
        .populate('client', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ gig: req.params.gigId }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getGigReviews };
