const express = require('express');
const { getCategories, adminGetCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const joiMiddleware = require('../middlewares/joiMiddleware');
const { createCategorySchema, updateCategorySchema } = require('../validators/categoryValidator');
const { idParamSchema } = require('../validators/queryParamSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Service category management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all active categories (public)
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: List of active categories
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories/admin/all:
 *   get:
 *     summary: Get all categories including inactive (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all categories
 */
router.get('/admin/all', authMiddleware, roleMiddleware('admin', 'super_admin'), adminGetCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Web Development
 *               slug:
 *                 type: string
 *                 example: web-development
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', authMiddleware, roleMiddleware('super_admin', 'admin'), zodMiddleware(createCategorySchema), createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update a category (admin)
 *     tags: [Categories]
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
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch('/:id', authMiddleware, roleMiddleware('super_admin', 'admin'), joiMiddleware({ params: idParamSchema }), zodMiddleware(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category (admin)
 *     tags: [Categories]
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
 *         description: Category deleted
 */
router.delete('/:id', authMiddleware, roleMiddleware('super_admin', 'admin'), joiMiddleware({ params: idParamSchema }), deleteCategory);

module.exports = router;
