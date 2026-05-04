const express = require('express');
const { addPackage, updatePackage, deletePackage, getPackagesByGig } = require('../controllers/gigPackageController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { gigPackageSchema } = require('../validators/gigPackageValidator');
const { gigIdParamSchema, packageIdParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GigPackages
 *   description: Pricing packages for gigs
 */

/**
 * @swagger
 * /api/gig-packages/{gigId}:
 *   get:
 *     summary: Get all packages for a gig (public)
 *     tags: [GigPackages]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of packages
 */
router.get('/:gigId', joiMiddleware({ params: gigIdParamSchema }), getPackagesByGig);

/**
 * @swagger
 * /api/gig-packages/{gigId}:
 *   post:
 *     summary: Add a package to a gig (provider)
 *     tags: [GigPackages]
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
 *             required: [type, name, price, deliveryDays]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [basic, standard, premium]
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               deliveryDays:
 *                 type: integer
 *               revisions:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Package added
 */
router.post('/:gigId', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: gigIdParamSchema }), zodMiddleware(gigPackageSchema), addPackage);

/**
 * @swagger
 * /api/gig-packages/package/{id}:
 *   patch:
 *     summary: Update a package (provider)
 *     tags: [GigPackages]
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
 *         description: Package updated
 */
router.patch('/package/:id', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: packageIdParamSchema }), updatePackage);

/**
 * @swagger
 * /api/gig-packages/package/{id}:
 *   delete:
 *     summary: Delete a package (provider)
 *     tags: [GigPackages]
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
 *         description: Package deleted
 */
router.delete('/package/:id', authMiddleware, roleMiddleware('provider'), joiMiddleware({ params: packageIdParamSchema }), deletePackage);

module.exports = router;
