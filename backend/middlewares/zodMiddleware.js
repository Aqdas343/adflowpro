const { createError } = require('../utils/errorUtils');

const zodMiddleware = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues ?? [];
    const messages = issues
      .map((i) => {
        const field = i.path.length > 0 ? `${i.path.join('.')}: ` : '';
        return `${field}${i.message}`;
      })
      .join('. ');
    return next(createError(422, messages || 'Validation failed.'));
  }
  req.body = result.data;
  next();
};

module.exports = zodMiddleware;
