const express = require('express');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const gigRoutes = require('./gigRoutes');
const gigPackageRoutes = require('./gigPackageRoutes');
const gigMediaRoutes = require('./gigMediaRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const reviewRoutes = require('./reviewRoutes');
const disputeRoutes = require('./disputeRoutes');
const notificationRoutes = require('./notificationRoutes');
const providerProfileRoutes = require('./providerProfileRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const moderatorRoutes = require('./moderatorRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/gigs', gigRoutes);
router.use('/gig-packages', gigPackageRoutes);
router.use('/gig-media', gigMediaRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/disputes', disputeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/provider-profile', providerProfileRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/moderator', moderatorRoutes);

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running.',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
