const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'placed',
  'payment_pending',
  'payment_verified',
  'in_progress',
  'delivered',
  'revision_requested',
  'completed',
  'closed',
  'cancelled',
  'archived',
];

const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client is required'],
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider is required'],
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: [true, 'Gig is required'],
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GigPackage',
      required: [true, 'Package is required'],
    },
    status: {
      type: String,
      enum: { values: ORDER_STATUSES, message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` },
      default: 'placed',
    },
    requirements: {
      type: String,
      trim: true,
      maxlength: [2000, 'Requirements cannot exceed 2000 characters'],
    },
    deadline: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    isOverdue: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ client: 1, status: 1 });
orderSchema.index({ provider: 1, status: 1 });
orderSchema.index({ deadline: 1 });

orderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Order', orderSchema);
