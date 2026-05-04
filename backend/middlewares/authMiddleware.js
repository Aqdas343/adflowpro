const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const { createError } = require('../utils/errorUtils');

const userCache = new Map();
const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX_SIZE = 500;

// NOTE: This is a single-process in-memory cache.
// In a multi-instance deployment (e.g. PM2 cluster, Kubernetes) each instance
// has its own cache, so a user banned on one instance may still be served from
// another instance's cache for up to CACHE_TTL_MS. Replace with Redis for
// true cross-instance consistency.

const getCachedUser = async (userId) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.user;
  }

  const user = await User.findById(userId);

  if (user) {
    if (userCache.size >= CACHE_MAX_SIZE) {
      const oldestKey = userCache.keys().next().value;
      userCache.delete(oldestKey);
    }
    userCache.set(userId, { user, ts: Date.now() });
  }

  return user;
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'Access denied. No token provided.'));
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(createError(401, 'Token has expired. Please log in again.'));
      }
      return next(createError(401, 'Invalid token.'));
    }

    const user = await getCachedUser(decoded.id);
    if (!user) {
      return next(createError(401, 'User no longer exists.'));
    }

    if (user.status !== 'active') {
      return next(createError(403, 'Your account has been suspended or banned.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
