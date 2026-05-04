const express = require('express');
const { createReview, getGigReviews } = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { createReviewSchema } = require('../validators/reviewValidator');
const { gigIdParamSchema, orderIdParamSchema, paginationQuery } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Client reviews after order completion
 */

/**
 * @swagger
 * /api/reviews/gig/{gigId}:
 *   get:
 *     summary: Get all reviews for a gig (public)
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
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
 *         description: List of reviews
 */
router.get('/gig/:gigId', joiMiddleware({ params: gigIdParamSchema, query: paginationQuery }), getGigReviews);

/**
 * @swagger
 * /api/reviews/{orderId}:
 *   post:
 *     summary: Submit a review for a completed order (client)
 *     tags: [Reviews]
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
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted
 */
router.post('/:orderId', authMiddleware, roleMiddleware('client'), joiMiddleware({ params: orderIdParamSchema }), zodMiddleware(createReviewSchema), createReview);

module.exports = router;
