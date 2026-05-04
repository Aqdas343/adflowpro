const ProviderProfile = require('../models/ProviderProfile');
const { createError } = require('../utils/errorUtils');

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.user._id }).populate('user', 'name email avatar');
    if (!profile) return next(createError(404, 'Provider profile not found.'));
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) return next(createError(404, 'Provider profile not found.'));
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.params.userId }).populate('user', 'name avatar createdAt');
    if (!profile) return next(createError(404, 'Provider profile not found.'));
    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyProfile, updateMyProfile, getPublicProfile };
