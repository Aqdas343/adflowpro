const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const User = require('../models/User');
const Review = require('../models/Review');

const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalUsers,
      totalGigs,
      activeGigs,
      pendingPayments,
      verifiedPayments,
      totalReviews,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['payment_verified', 'in_progress', 'delivered', 'revision_requested'] } }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'cancelled' }),
      User.countDocuments(),
      Gig.countDocuments(),
      Gig.countDocuments({ status: 'active' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'verified' }),
      Review.countDocuments(),
    ]);

    const revenueResult = await Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const gigsByStatus = await Gig.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const topProviders = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$provider', completedOrders: { $sum: 1 } } },
      { $sort: { completedOrders: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'provider' } },
      { $unwind: '$provider' },
      { $project: { 'provider.name': 1, 'provider.email': 1, completedOrders: 1 } },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        orders: { total: totalOrders, active: activeOrders, completed: completedOrders, cancelled: cancelledOrders },
        users: { total: totalUsers },
        gigs: { total: totalGigs, active: activeGigs, byStatus: gigsByStatus },
        payments: { pending: pendingPayments, verified: verifiedPayments, totalRevenue },
        reviews: { total: totalReviews },
        topProviders,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
