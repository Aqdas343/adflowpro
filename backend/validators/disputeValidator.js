const { z } = require('zod');

const openDisputeSchema = z.object({
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason cannot exceed 1000 characters'),
});

const resolveDisputeSchema = z.object({
  action: z.enum(['resolve', 'close'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be resolve or close',
  }),
  resolutionNote: z.string()
    .min(5, 'Resolution note must be at least 5 characters')
    .max(1000, 'Resolution note cannot exceed 1000 characters'),
});

module.exports = { openDisputeSchema, resolveDisputeSchema };
