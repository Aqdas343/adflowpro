const express = require('express');
const { getModerationQueue } = require('../controllers/gigController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Moderator
 *   description: Moderator review queue
 */

/**
 * @swagger
 * /api/moderator/queue:
 *   get:
 *     summary: Get all submitted gigs awaiting moderation
 *     tags: [Moderator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of submitted gigs in review queue
 */
router.get('/queue', authMiddleware, roleMiddleware('moderator', 'admin', 'super_admin'), getModerationQueue);

module.exports = router;
