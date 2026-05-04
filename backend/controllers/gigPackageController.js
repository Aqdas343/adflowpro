const GigPackage = require('../models/GigPackage');
const Gig = require('../models/Gig');
const { createError } = require('../utils/errorUtils');

const addPackage = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));

    const existing = await GigPackage.findOne({ gig: gig._id, type: req.body.type });
    if (existing) return next(createError(409, `A ${req.body.type} package already exists for this gig.`));

    const pkg = await GigPackage.create({ gig: gig._id, ...req.body });
    res.status(201).json({ success: true, package: pkg });
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const pkg = await GigPackage.findById(req.params.id).populate('gig', 'provider');
    if (!pkg) return next(createError(404, 'Package not found.'));
    if (pkg.gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));

    Object.assign(pkg, req.body);
    await pkg.save();
    res.status(200).json({ success: true, package: pkg });
  } catch (error) {
    next(error);
  }
};

const deletePackage = async (req, res, next) => {
  try {
    const pkg = await GigPackage.findById(req.params.id).populate('gig', 'provider');
    if (!pkg) return next(createError(404, 'Package not found.'));
    if (pkg.gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));

    await pkg.deleteOne();
    res.status(200).json({ success: true, message: 'Package deleted.' });
  } catch (error) {
    next(error);
  }
};

const getPackagesByGig = async (req, res, next) => {
  try {
    const packages = await GigPackage.find({ gig: req.params.gigId });
    res.status(200).json({ success: true, packages });
  } catch (error) {
    next(error);
  }
};

module.exports = { addPackage, updatePackage, deletePackage, getPackagesByGig };
