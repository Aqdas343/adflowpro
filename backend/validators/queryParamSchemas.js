const Joi = require('joi');

const objectId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i, 'MongoDB ObjectId')
  .messages({ 'string.pattern.name': '{{#label}} must be a valid ID' });

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'page must be a number',
    'number.integer': 'page must be a whole number',
    'number.min': 'page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'limit must be a number',
    'number.integer': 'limit must be a whole number',
    'number.min': 'limit must be at least 1',
    'number.max': 'limit cannot exceed 100',
  }),
});

const gigQuerySchema = paginationQuery.keys({
  category: objectId.optional().label('category'),
  search: Joi.string().max(100).optional().messages({
    'string.max': 'search term cannot exceed 100 characters',
  }),
  sort: Joi.string().valid('latest', 'rating', 'orders').default('latest').optional().messages({
    'any.only': 'sort must be one of: latest, rating, orders',
  }),
});

const adminGigQuerySchema = paginationQuery.keys({
  status: Joi.string()
    .valid('draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'paused')
    .optional()
    .messages({ 'any.only': 'status must be a valid gig status' }),
});

const orderStatusQuerySchema = paginationQuery.keys({
  status: Joi.string()
    .valid('placed', 'payment_pending', 'payment_verified', 'in_progress', 'delivered', 'revision_requested', 'completed', 'closed', 'cancelled', 'archived')
    .optional()
    .messages({ 'any.only': 'status must be a valid order status' }),
});

const disputeQuerySchema = Joi.object({
  status: Joi.string()
    .valid('open', 'under_review', 'resolved', 'closed')
    .optional()
    .messages({ 'any.only': 'status must be one of: open, under_review, resolved, closed' }),
});

const idParamSchema = Joi.object({
  id: objectId.required().label('id'),
});

const gigIdParamSchema = Joi.object({
  gigId: objectId.required().label('gigId'),
});

const orderIdParamSchema = Joi.object({
  orderId: objectId.required().label('orderId'),
});

const userIdParamSchema = Joi.object({
  userId: objectId.required().label('userId'),
});

const slugParamSchema = Joi.object({
  slug: Joi.string().min(1).max(150).required().label('slug').messages({
    'string.min': 'slug is required',
    'string.max': 'slug cannot exceed 150 characters',
  }),
});

const packageIdParamSchema = Joi.object({
  id: objectId.required().label('package id'),
});

module.exports = {
  gigQuerySchema,
  adminGigQuerySchema,
  orderStatusQuerySchema,
  disputeQuerySchema,
  paginationQuery,
  idParamSchema,
  gigIdParamSchema,
  orderIdParamSchema,
  userIdParamSchema,
  slugParamSchema,
  packageIdParamSchema,
};
