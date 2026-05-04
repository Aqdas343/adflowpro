const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['order', 'payment', 'review', 'moderation', 'system', 'dispute'];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: { values: NOTIFICATION_TYPES, message: `Type must be one of: ${NOTIFICATION_TYPES.join(', ')}` },
      required: [true, 'Type is required'],
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Notification', notificationSchema);
