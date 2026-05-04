const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Platform analytics and KPIs
 */

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get platform analytics dashboard data (admin)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data including orders, revenue, users, gigs, and top providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                     payments:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         verified:
 *                           type: integer
 *                         totalRevenue:
 *                           type: number
 *                     gigs:
 *                       type: object
 *                     users:
 *                       type: object
 *                     topProviders:
 *                       type: array
 */
router.get('/', authMiddleware, roleMiddleware('admin', 'super_admin'), getAnalytics);

module.exports = router;
