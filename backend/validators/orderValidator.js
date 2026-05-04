const { z } = require('zod');

const placeOrderSchema = z.object({
  gigId: z.string().min(1, 'Gig ID is required'),
  packageId: z.string().min(1, 'Package ID is required'),
  requirements: z.string().max(2000, 'Requirements cannot exceed 2000 characters').optional(),
});

const revisionSchema = z.object({
  note: z.string()
    .min(5, 'Revision note must be at least 5 characters')
    .max(500, 'Note cannot exceed 500 characters'),
});

module.exports = { placeOrderSchema, revisionSchema };
