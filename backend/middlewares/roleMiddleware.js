const { createError } = require('../utils/errorUtils');

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(createError(403, `Access denied. Required role(s): ${allowedRoles.join(', ')}.`));
    }
    next();
  };
};

module.exports = roleMiddleware;
