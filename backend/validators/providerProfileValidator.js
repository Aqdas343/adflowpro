const { z } = require('zod');

const updateProviderProfileSchema = z.object({
  displayName: z.string().max(60, 'Display name cannot exceed 60 characters').optional(),
  businessName: z.string().max(80, 'Business name cannot exceed 80 characters').optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  skills: z.array(z.string()).optional(),
  city: z.string().max(60, 'City cannot exceed 60 characters').optional(),
  portfolioUrls: z.array(z.string().url('Each portfolio URL must be valid')).optional(),
});

module.exports = { updateProviderProfileSchema };
