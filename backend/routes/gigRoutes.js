const express = require('express');
const {
  createGig, updateGig, submitGig, getActiveGigs, getGigBySlug, getGigById,
  getProviderGigs, getModerationQueue, moderateGig, adminActivateGig, adminGetAllGigs,
} = require('../controllers/gigController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { createGigSchema, updateGigSchema, moderateGigSchema } = require('../validators/gigValidator');
const { gigQuerySchema, adminGigQuerySchema, paginationQuery, idParamSchema, slugParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gigs
 *   description: Gig listing management
 */

/**
 * @swagger
 * /api/gigs:
 *   get:
 *     summary: Browse all active gigs (public)
 *     tags: [Gigs]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, rating, orders]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Paginated list of active gigs
 */
router.get('/', joiMiddleware({ query: gigQuerySchema }), getActiveGigs);

/**
 * @swagger
 * /api/gigs/provider/mine:
 *   get:
 *     summary: Get all gigs created by the authenticated provider
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of provider's own gigs
 */
router.get('/provider/mine', authMiddleware, roleMiddleware('provider'), joiMiddleware({ query: paginationQuery }), getProviderGigs);

/**
 * @swagger
 * /api/gigs/admin/all:
 *   get:
 *     summary: Get all gigs filtered by status (admin)
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, under_review, approved, active, rejected, paused]
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
 *         description: List of gigs
 */
router.get('/admin/all', authMiddleware, roleMiddleware('admin', 'super_admin'), joiMiddleware({ query: adminGigQuerySchema }), adminGetAllGigs);

router.get('/id/:id', authMiddleware, joiMiddleware({ params: idParamSchema }), getGigById);

/**
 * @swagger
 * /api/gigs/{slug}:
 *   get:
 *     summary: Get gig detail by slug (public)
 *     tags: [Gigs]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gig detail with packages and media
 *       404:
 *         description: Gig not found
 */
router.get('/:slug', joiMiddleware({ params: slugParamSchema }), getGigBySlug);

/**
 * @swagger
 * /api/gigs:
 *   post:
 *     summary: Create a new gig draft (provider)
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, title, description]
 *             properties:
 *               category:
 *                 type: string
 *                 example: 64abc123def456
 *               title:
 *                 type: string
 *                 example: I will build a professional React website
 *               description:
 *                 type: string
 *                 example: Full-stack React application with Node.js backend, MongoDB database, and responsive design.
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Gig created as draft
 */
router.post('/', authMiddleware, roleMiddleware('provider'), zodMiddleware(createGigSchema), createGig);

/**
 * @swagger
 * /api/gigs/{id}:
 *   patch:
 *     summary: Update a gig (provider, only draft or rejected)
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Gig updated
 */
router.patch('/:id', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: idParamSchema }), zodMiddleware(updateGigSchema), updateGig);

/**
 * @swagger
 * /api/gigs/{id}/submit:
 *   patch:
 *     summary: Submit gig for moderator review (provider)
 *     tags: [Gigs]
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
 *         description: Gig submitted for review
 */
router.patch('/:id/submit', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: idParamSchema }), submitGig);

/**
 * @swagger
 * /api/gigs/{id}/moderate:
 *   patch:
 *     summary: Approve or reject a submitted gig (moderator)
 *     tags: [Gigs]
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
 *                 enum: [approve, reject]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gig moderated
 */
router.patch('/:id/moderate', authMiddleware, roleMiddleware('moderator', 'admin', 'super_admin'), joiMiddleware({ params: idParamSchema }), zodMiddleware(moderateGigSchema), moderateGig);

/**
 * @swagger
 * /api/gigs/{id}/activate:
 *   patch:
 *     summary: Activate an approved gig (admin)
 *     tags: [Gigs]
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
 *         description: Gig is now active and publicly visible
 */
router.patch('/:id/activate', authMiddleware, roleMiddleware('admin', 'super_admin'), joiMiddleware({ params: idParamSchema }), adminActivateGig);

module.exports = router;
