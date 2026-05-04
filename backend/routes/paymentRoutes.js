const express = require('express');
const { submitPayment, verifyPayment, getPendingPayments } = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { submitPaymentSchema, verifyPaymentSchema } = require('../validators/paymentValidator');
const { orderIdParamSchema, idParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Escrow-style payment management
 */

/**
 * @swagger
 * /api/payments/pending:
 *   get:
 *     summary: Get all pending payments (admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending payments
 */
router.get('/pending', authMiddleware, roleMiddleware('admin', 'super_admin'), getPendingPayments);

/**
 * @swagger
 * /api/payments/{orderId}:
 *   post:
 *     summary: Submit payment proof for an order (client)
 *     tags: [Payments]
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
 *             required: [method, transactionRef]
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [bank_transfer, easypaisa, jazzcash, card, other]
 *               transactionRef:
 *                 type: string
 *                 example: TXN-20240101-001
 *               senderName:
 *                 type: string
 *               screenshotUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment submitted, awaiting verification
 */
router.post('/:orderId', authMiddleware, roleMiddleware('client'), joiMiddleware({ params: orderIdParamSchema }), zodMiddleware(submitPaymentSchema), submitPayment);

/**
 * @swagger
 * /api/payments/{id}/verify:
 *   patch:
 *     summary: Verify or reject a pending payment (admin)
 *     tags: [Payments]
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [verify, reject]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified or rejected
 */
router.patch('/:id/verify', authMiddleware, roleMiddleware('admin', 'super_admin'), joiMiddleware({ params: idParamSchema }), zodMiddleware(verifyPaymentSchema), verifyPayment);

module.exports = router;
