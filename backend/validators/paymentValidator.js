const { z } = require('zod');

const submitPaymentSchema = z.object({
  method: z.enum(['bank_transfer', 'easypaisa', 'jazzcash', 'card', 'other'], {
    required_error: 'Payment method is required',
    invalid_type_error: 'Invalid payment method',
  }),
  transactionRef: z.string()
    .min(4, 'Transaction reference must be at least 4 characters')
    .max(100, 'Transaction reference cannot exceed 100 characters'),
  senderName: z.string().max(80, 'Sender name cannot exceed 80 characters').optional(),
  screenshotUrl: z.string().url('screenshotUrl must be a valid URL starting with http/https').optional(),
});

const verifyPaymentSchema = z.object({
  action: z.enum(['verify', 'reject'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be verify or reject',
  }),
  rejectionReason: z.string().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});

module.exports = { submitPaymentSchema, verifyPaymentSchema };
