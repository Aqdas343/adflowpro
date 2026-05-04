const express = require('express');
const { openDispute, getAdminDisputes, resolveDispute } = require('../controllers/disputeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { openDisputeSchema, resolveDisputeSchema } = require('../validators/disputeValidator');
const { disputeQuerySchema, orderIdParamSchema, idParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Disputes
 *   description: Order dispute management
 */

/**
 * @swagger
 * /api/disputes/admin:
 *   get:
 *     summary: Get all disputes (admin)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, under_review, resolved, closed]
 *     responses:
 *       200:
 *         description: List of disputes
 */
router.get('/admin', authMiddleware, roleMiddleware('admin', 'super_admin'), joiMiddleware({ query: disputeQuerySchema }), getAdminDisputes);

/**
 * @swagger
 * /api/disputes/{orderId}:
 *   post:
 *     summary: Open a dispute on an order (client or provider)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Provider did not deliver the agreed work.
 *     responses:
 *       201:
 *         description: Dispute opened
 */
router.post('/:orderId', authMiddleware, joiMiddleware({ params: orderIdParamSchema }), zodMiddleware(openDisputeSchema), openDispute);

/**
 * @swagger
 * /api/disputes/{id}/resolve:
 *   patch:
 *     summary: Resolve or close a dispute (admin)
 *     tags: [Disputes]
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
 *             required: [action, resolutionNote]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [resolve, close]
 *               resolutionNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved or closed
 */
router.patch('/:id/resolve', authMiddleware, roleMiddleware('admin', 'super_admin'), joiMiddleware({ params: idParamSchema }), zodMiddleware(resolveDisputeSchema), resolveDispute);

module.exports = router;
