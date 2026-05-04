const express = require('express');
const { getMyNotifications, markAllRead, markOneRead } = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { idParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get current user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications with unread count
 */
router.get('/', authMiddleware, getMyNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', authMiddleware, markAllRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
router.patch('/:id/read', authMiddleware, joiMiddleware({ params: idParamSchema }), markOneRead);

module.exports = router;
