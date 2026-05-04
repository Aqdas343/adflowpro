const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [60, 'Display name cannot exceed 60 characters'],
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: [80, 'Business name cannot exceed 80 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    skills: {
      type: [String],
      default: [],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [60, 'City cannot exceed 60 characters'],
    },
    portfolioUrls: {
      type: [String],
      default: [],
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    completedOrders: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

providerProfileSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
