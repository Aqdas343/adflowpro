const { z } = require('zod');

const createGigSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(3000, 'Description cannot exceed 3000 characters'),
  tags: z.array(z.string()).max(10, 'Cannot have more than 10 tags').optional().default([]),
});

const updateGigSchema = z.object({
  category: z.string().min(1).optional(),
  title: z.string().min(10, 'Title must be at least 10 characters').max(100).optional(),
  description: z.string().min(50, 'Description must be at least 50 characters').max(3000).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const moderateGigSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
});

module.exports = { createGigSchema, updateGigSchema, moderateGigSchema };
