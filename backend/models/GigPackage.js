const mongoose = require('mongoose');

const PACKAGE_TYPES = ['basic', 'standard', 'premium'];

const gigPackageSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: [true, 'Gig is required'],
    },
    type: {
      type: String,
      enum: { values: PACKAGE_TYPES, message: `Type must be one of: ${PACKAGE_TYPES.join(', ')}` },
      required: [true, 'Package type is required'],
    },
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
      maxlength: [60, 'Package name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least $1'],
      max: [10000, 'Price cannot exceed $10,000'],
    },
    deliveryDays: {
      type: Number,
      required: [true, 'Delivery days is required'],
      min: [1, 'Delivery must be at least 1 day'],
      max: [365, 'Delivery cannot exceed 365 days'],
    },
    revisions: {
      type: Number,
      default: 1,
      min: [0, 'Revisions cannot be negative'],
      max: [20, 'Revisions cannot exceed 20'],
    },
    features: { type: [String], default: [] },
  },
  { timestamps: true }
);

gigPackageSchema.index({ gig: 1, type: 1 }, { unique: true });

gigPackageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('GigPackage', gigPackageSchema);
