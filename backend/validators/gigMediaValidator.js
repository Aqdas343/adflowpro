const { z } = require('zod');

const addMediaSchema = z.object({
  sourceType: z.enum(['image', 'video', 'document'], {
    required_error: 'Source type is required',
    invalid_type_error: 'Source type must be image, video, or document',
  }),
  originalUrl: z.string().url('originalUrl must be a valid URL starting with http/https'),
  thumbnailUrl: z.string().url('thumbnailUrl must be a valid URL starting with http/https').optional(),
});

module.exports = { addMediaSchema };
