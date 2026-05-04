const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'verified', 'rejected'];
const PAYMENT_METHODS = ['bank_transfer', 'easypaisa', 'jazzcash', 'card', 'other'];

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least $1'],
    },
    method: {
      type: String,
      enum: { values: PAYMENT_METHODS, message: `Method must be one of: ${PAYMENT_METHODS.join(', ')}` },
      required: [true, 'Payment method is required'],
    },
    transactionRef: {
      type: String,
      required: [true, 'Transaction reference is required'],
      trim: true,
      unique: true,
      minlength: [4, 'Transaction reference must be at least 4 characters'],
      maxlength: [100, 'Transaction reference cannot exceed 100 characters'],
    },
    senderName: {
      type: String,
      trim: true,
      maxlength: [80, 'Sender name cannot exceed 80 characters'],
    },
    screenshotUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Must be a valid URL'],
      default: null,
    },
    status: {
      type: String,
      enum: { values: PAYMENT_STATUSES, message: `Status must be one of: ${PAYMENT_STATUSES.join(', ')}` },
      default: 'pending',
    },
    rejectionReason: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ transactionRef: 1 });
paymentSchema.index({ status: 1 });

paymentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Payment', paymentSchema);
