const { createError } = require('../utils/errorUtils');

const joiMiddleware = (schemas) => (req, res, next) => {
  const errors = [];

  if (schemas.query) {
    const { error, value } = schemas.query.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    } else {
      req.query = value;
    }
  }

  if (schemas.params) {
    const { error, value } = schemas.params.validate(req.params, {
      abortEarly: false,
      convert: false,
    });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    } else {
      req.params = value;
    }
  }

  if (errors.length > 0) {
    return next(createError(422, errors.join('. ')));
  }

  next();
};

module.exports = joiMiddleware;
