const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(50, 'Slug cannot exceed 50 characters').toLowerCase(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(2).max(50).optional(),
  slug: z.string().min(2).max(50).toLowerCase().optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createCategorySchema, updateCategorySchema };
