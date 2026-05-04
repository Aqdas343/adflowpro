const mongoose = require('mongoose');

const SOURCE_TYPES = ['image', 'video', 'document'];
const VALIDATION_STATUSES = ['pending', 'valid', 'invalid'];

const gigMediaSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: [true, 'Gig is required'],
    },
    sourceType: {
      type: String,
      enum: { values: SOURCE_TYPES, message: `Source type must be one of: ${SOURCE_TYPES.join(', ')}` },
      required: [true, 'Source type is required'],
    },
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'Must be a valid URL'],
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Must be a valid URL'],
      default: null,
    },
    validationStatus: {
      type: String,
      enum: { values: VALIDATION_STATUSES, message: `Validation status must be one of: ${VALIDATION_STATUSES.join(', ')}` },
      default: 'pending',
    },
  },
  { timestamps: true }
);

gigMediaSchema.index({ gig: 1 });

gigMediaSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('GigMedia', gigMediaSchema);
