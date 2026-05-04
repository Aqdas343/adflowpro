const { z } = require('zod');

const gigPackageSchema = z.object({
  type: z.enum(['basic', 'standard', 'premium']),
  name: z.string().min(1, 'Package name is required').max(60, 'Package name cannot exceed 60 characters'),
  description: z.string().max(300, 'Description cannot exceed 300 characters').optional(),
  price: z.number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .min(1, 'Price must be at least $1').max(10000, 'Price cannot exceed $10,000'),
  deliveryDays: z.number({ required_error: 'Delivery days is required', invalid_type_error: 'Delivery days must be a number' })
    .int('Delivery days must be a whole number').min(1, 'Delivery must be at least 1 day').max(365, 'Delivery cannot exceed 365 days'),
  revisions: z.number().int().min(0).max(20).optional().default(1),
  features: z.array(z.string()).optional().default([]),
});

module.exports = { gigPackageSchema };
