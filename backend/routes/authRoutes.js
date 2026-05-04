const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require('../config/passport');
const { register, login, getMe, googleCallback } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const zodMiddleware = require('../middlewares/zodMiddleware');
const { registerSchema, loginSchema } = require('../validators/userValidator');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many accounts created from this IP. Please try again in an hour.' },
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Secret123
 *               role:
 *                 type: string
 *                 enum: [client, provider]
 *                 example: client
 *     responses:
 *       201:
 *         description: Account created successfully
 *       409:
 *         description: Email already exists
 *       422:
 *         description: Validation error
 */
router.post('/register', registerLimiter, zodMiddleware(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Secret123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       400:
 *         description: Account uses Google Sign-In
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account suspended or banned
 */
router.post('/login', loginLimiter, zodMiddleware(loginSchema), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns current user object
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, getMe);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     security: []
 *     description: >
 *       Redirects the browser to Google's OAuth consent screen.
 *       Cannot be tested directly in Swagger — open this URL in your browser:
 *       `http://localhost:5000/api/auth/google`
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback (handled by Google, not called directly)
 *     tags: [Auth]
 *     security: []
 *     description: >
 *       Google redirects here after authentication.
 *       On success, redirects to `CLIENT_URL/oauth/callback?token=JWT_TOKEN`.
 *       On failure, redirects to `CLIENT_URL/login?error=oauth_failed`.
 *     responses:
 *       302:
 *         description: Redirects to frontend with JWT token
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  googleCallback
);

router.get('/google/failure', (_req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}/login?error=oauth_failed`);
});

module.exports = router;
