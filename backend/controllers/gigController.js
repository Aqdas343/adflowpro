const Gig = require('../models/Gig');
const GigPackage = require('../models/GigPackage');
const GigMedia = require('../models/GigMedia');
const AuditLog = require('../models/AuditLog');
const { createError } = require('../utils/errorUtils');

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const createGig = async (req, res, next) => {
  try {
    const { category, title, description, tags } = req.body;
    const slug = slugify(title) + '-' + Date.now();
    const gig = await Gig.create({ provider: req.user._id, category, title, slug, description, tags });
    await gig.populate('category', 'name slug');
    res.status(201).json({ success: true, message: 'Gig created as draft.', gig });
  } catch (error) {
    next(error);
  }
};

const updateGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));
    if (!['draft', 'rejected'].includes(gig.status)) return next(createError(400, 'Only draft or rejected gigs can be edited.'));

    Object.assign(gig, req.body);
    await gig.save();
    await gig.populate('category', 'name slug');
    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

const submitGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));
    if (!['draft', 'rejected'].includes(gig.status)) return next(createError(400, `Cannot submit a gig with status: ${gig.status}.`));

    const packages = await GigPackage.countDocuments({ gig: gig._id });
    if (packages === 0) return next(createError(400, 'Add at least one package before submitting.'));

    gig.status = 'submitted';
    await gig.save();
    res.status(200).json({ success: true, message: 'Gig submitted for review.', gig });
  } catch (error) {
    next(error);
  }
};

const getActiveGigs = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;

    const filter = { status: 'active' };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const sortOption =
      sort === 'rating' ? { ratingAvg: -1 } :
      sort === 'orders' ? { totalOrders: -1 } :
      { createdAt: -1 };

    const [gigs, total] = await Promise.all([
      Gig.find(filter)
        .populate('provider', 'name avatar')
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Gig.countDocuments(filter),
    ]);

    const gigIds = gigs.map((g) => g._id);
    const packages = await GigPackage.find({ gig: { $in: gigIds } }).select('gig price');

    const lowestPriceMap = {};
    for (const pkg of packages) {
      const id = pkg.gig.toString();
      if (lowestPriceMap[id] === undefined || pkg.price < lowestPriceMap[id]) {
        lowestPriceMap[id] = pkg.price;
      }
    }

    const gigsWithPrice = gigs.map((g) => {
      const obj = g.toJSON();
      obj.lowestPrice = lowestPriceMap[g._id.toString()] ?? null;
      return obj;
    });

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      gigs: gigsWithPrice,
    });
  } catch (error) {
    next(error);
  }
};

const getGigBySlug = async (req, res, next) => {
  try {
    const gig = await Gig.findOne({ slug: req.params.slug, status: 'active' })
      .populate('provider', 'name avatar')
      .populate('category', 'name slug');
    if (!gig) return next(createError(404, 'Gig not found.'));

    const packages = await GigPackage.find({ gig: gig._id });
    const media = await GigMedia.find({ gig: gig._id });

    res.status(200).json({ success: true, gig, packages, media });
  } catch (error) {
    next(error);
  }
};

const getProviderGigs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [gigs, total] = await Promise.all([
      Gig.find({ provider: req.user._id })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Gig.countDocuments({ provider: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: gigs.length,
      gigs,
    });
  } catch (error) {
    next(error);
  }
};

const getModerationQueue = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ status: 'submitted' })
      .populate('provider', 'name email')
      .populate('category', 'name')
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: gigs.length, gigs });
  } catch (error) {
    next(error);
  }
};

const moderateGig = async (req, res, next) => {
  try {
    const { action, note } = req.body;
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.status !== 'submitted') return next(createError(400, 'Only submitted gigs can be moderated.'));

    gig.status = action === 'approve' ? 'approved' : 'rejected';
    gig.moderationNote = note || null;
    await gig.save();

    await AuditLog.create({
      actor: req.user._id,
      actionType: `gig_${action}d`,
      targetType: 'Gig',
      targetId: gig._id,
      oldValue: 'submitted',
      newValue: gig.status,
    });

    res.status(200).json({ success: true, message: `Gig ${action}d.`, gig });
  } catch (error) {
    next(error);
  }
};

const adminActivateGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.status !== 'approved') return next(createError(400, 'Only approved gigs can be activated.'));

    gig.status = 'active';
    await gig.save();

    await AuditLog.create({
      actor: req.user._id,
      actionType: 'gig_activated',
      targetType: 'Gig',
      targetId: gig._id,
      oldValue: 'approved',
      newValue: 'active',
    });

    res.status(200).json({ success: true, message: 'Gig is now active.', gig });
  } catch (error) {
    next(error);
  }
};

const adminGetAllGigs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [gigs, total] = await Promise.all([
      Gig.find(filter)
        .populate('provider', 'name email')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Gig.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: gigs.length,
      gigs,
    });
  } catch (error) {
    next(error);
  }
};

const getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('provider', 'name avatar')
      .populate('category', 'name slug');
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.provider._id.toString() !== req.user._id.toString()) {
      return next(createError(403, 'Not authorized.'));
    }
    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));

    const deletableStatuses = ['draft', 'rejected'];
    if (!deletableStatuses.includes(gig.status)) {
      return next(createError(400, `Cannot delete a gig with status "${gig.status}". Only draft or rejected gigs can be deleted.`));
    }

    await GigPackage.deleteMany({ gig: gig._id });
    await GigMedia.deleteMany({ gig: gig._id });
    await gig.deleteOne();

    res.status(200).json({ success: true, message: 'Gig deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGig,
  updateGig,
  submitGig,
  getActiveGigs,
  getGigBySlug,
  getGigById,
  deleteGig,
  getProviderGigs,
  getModerationQueue,
  moderateGig,
  adminActivateGig,
  adminGetAllGigs,
};
