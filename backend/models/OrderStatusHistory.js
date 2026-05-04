const mongoose = require('mongoose');

const orderStatusHistorySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
    },
    previousStatus: {
      type: String,
      trim: true,
      default: null,
    },
    newStatus: {
      type: String,
      required: [true, 'New status is required'],
      trim: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Changed by is required'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: null,
    },
  },
  { timestamps: true }
);

orderStatusHistorySchema.index({ order: 1 });
orderStatusHistorySchema.index({ createdAt: -1 });

orderStatusHistorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
