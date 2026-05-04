const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    if (process.env.NODE_ENV === 'production') {
      message = 'A record with the provided value already exists.';
    } else {
      const field = Object.keys(err.keyValue)[0];
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    }
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = process.env.NODE_ENV === 'production'
      ? 'Invalid ID format.'
      : `Invalid ${err.path}: ${err.value}`;
  }

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
