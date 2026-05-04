const express = require('express');
const { addMedia, deleteMedia, getGigMedia } = require('../controllers/gigMediaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { addMediaSchema } = require('../validators/gigMediaValidator');
const { gigIdParamSchema, idParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GigMedia
 *   description: External media URLs for gigs
 */

/**
 * @swagger
 * /api/gig-media/{gigId}:
 *   get:
 *     summary: Get all media for a gig (public)
 *     tags: [GigMedia]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of media items
 */
router.get('/:gigId', joiMiddleware({ params: gigIdParamSchema }), getGigMedia);

/**
 * @swagger
 * /api/gig-media/{gigId}:
 *   post:
 *     summary: Add a media URL to a gig (provider)
 *     tags: [GigMedia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sourceType, originalUrl]
 *             properties:
 *               sourceType:
 *                 type: string
 *                 enum: [image, video, document]
 *                 example: image
 *               originalUrl:
 *                 type: string
 *                 example: https://i.imgur.com/example.jpg
 *               thumbnailUrl:
 *                 type: string
 *                 example: https://i.imgur.com/example_thumb.jpg
 *     responses:
 *       201:
 *         description: Media added
 *       403:
 *         description: Not authorized
 */
router.post('/:gigId', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: gigIdParamSchema }), zodMiddleware(addMediaSchema), addMedia);

/**
 * @swagger
 * /api/gig-media/{id}:
 *   delete:
 *     summary: Delete a media item (provider)
 *     tags: [GigMedia]
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
 *         description: Media deleted
 *       403:
 *         description: Not authorized
 */
router.delete('/:id', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: idParamSchema }), deleteMedia);

module.exports = router;
