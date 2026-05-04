const express = require('express');
const {
  placeOrder, getClientOrders, getProviderOrders, startOrder,
  deliverOrder, requestRevision, completeOrder, getOrderStatusHistory, adminGetAllOrders,
} = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { placeOrderSchema, revisionSchema } = require('../validators/orderValidator');
const { orderStatusQuerySchema, idParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order lifecycle management
 */

/**
 * @swagger
 * /api/orders/admin:
 *   get:
 *     summary: Get all orders (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all orders
 */
router.get('/admin', authMiddleware, roleMiddleware('admin', 'super_admin'), joiMiddleware({ query: orderStatusQuerySchema }), adminGetAllOrders);

/**
 * @swagger
 * /api/orders/client:
 *   get:
 *     summary: Get client's own orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of client orders
 */
router.get('/client', authMiddleware, roleMiddleware('client'), joiMiddleware({ query: orderStatusQuerySchema }), getClientOrders);

/**
 * @swagger
 * /api/orders/provider:
 *   get:
 *     summary: Get provider's incoming orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of provider orders
 */
router.get('/provider', authMiddleware, roleMiddleware('provider'), joiMiddleware({ query: orderStatusQuerySchema }), getProviderOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order (client)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [gigId, packageId]
 *             properties:
 *               gigId:
 *                 type: string
 *               packageId:
 *                 type: string
 *               requirements:
 *                 type: string
 *                 example: Please use blue color scheme and include a contact form.
 *     responses:
 *       201:
 *         description: Order placed successfully
 */
router.post('/', authMiddleware, roleMiddleware('client'), zodMiddleware(placeOrderSchema), placeOrder);

/**
 * @swagger
 * /api/orders/{id}/start:
 *   patch:
 *     summary: Start work on a verified order (provider)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order is now in progress
 */
router.patch('/:id/start', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: idParamSchema }), startOrder);

/**
 * @swagger
 * /api/orders/{id}/deliver:
 *   patch:
 *     summary: Mark order as delivered (provider)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order marked as delivered
 */
router.patch('/:id/deliver', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: idParamSchema }), deliverOrder);

/**
 * @swagger
 * /api/orders/{id}/revision:
 *   patch:
 *     summary: Request a revision on a delivered order (client)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note:
 *                 type: string
 *                 example: Please change the font and add more spacing.
 *     responses:
 *       200:
 *         description: Revision requested
 */
router.patch('/:id/revision', authMiddleware, roleMiddleware('client'), joiMiddleware({ params: idParamSchema }), zodMiddleware(revisionSchema), requestRevision);

/**
 * @swagger
 * /api/orders/{id}/complete:
 *   patch:
 *     summary: Mark delivered order as completed (client)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order completed
 */
router.patch('/:id/complete', authMiddleware, roleMiddleware('client'), joiMiddleware({ params: idParamSchema }), completeOrder);

/**
 * @swagger
 * /api/orders/{id}/history:
 *   get:
 *     summary: Get status change history for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status history
 */
router.get('/:id/history', authMiddleware, joiMiddleware({ params: idParamSchema }), getOrderStatusHistory);

module.exports = router;
