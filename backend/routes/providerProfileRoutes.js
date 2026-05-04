const express = require('express');
const { getMyProfile, updateMyProfile, getPublicProfile } = require('../controllers/providerProfileController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { updateProviderProfileSchema } = require('../validators/providerProfileValidator');
const { userIdParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProviderProfile
 *   description: Provider public profile management
 */

/**
 * @swagger
 * /api/provider-profile/me:
 *   get:
 *     summary: Get own provider profile
 *     tags: [ProviderProfile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider profile
 */
router.get('/me', authMiddleware, roleMiddleware('provider'), getMyProfile);

/**
 * @swagger
 * /api/provider-profile/me:
 *   patch:
 *     summary: Update own provider profile
 *     tags: [ProviderProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               businessName:
 *                 type: string
 *               bio:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               city:
 *                 type: string
 *               portfolioUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/me', authMiddleware, roleMiddleware('provider'), zodMiddleware(updateProviderProfileSchema), updateMyProfile);

/**
 * @swagger
 * /api/provider-profile/{userId}:
 *   get:
 *     summary: Get public provider profile by user ID
 *     tags: [ProviderProfile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public provider profile
 */
router.get('/:userId', joiMiddleware({ params: userIdParamSchema }), getPublicProfile);

module.exports = router;
