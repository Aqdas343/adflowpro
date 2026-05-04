const mongoose = require('mongoose');

const GIG_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'paused'];

const gigSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: { values: GIG_STATUSES, message: `Status must be one of: ${GIG_STATUSES.join(', ')}` },
      default: 'draft',
    },
    featured: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    moderationNote: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

gigSchema.index({ status: 1, createdAt: -1 });
gigSchema.index({ provider: 1, status: 1 });
gigSchema.index({ category: 1, status: 1 });
gigSchema.index({ slug: 1 });
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });

gigSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Gig', gigSchema);
