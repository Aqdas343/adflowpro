const GigMedia = require('../models/GigMedia');
const Gig = require('../models/Gig');
const { createError } = require('../utils/errorUtils');

const addMedia = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return next(createError(404, 'Gig not found.'));
    if (gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));

    const { sourceType, originalUrl, thumbnailUrl } = req.body;

    const media = await GigMedia.create({
      gig: gig._id,
      sourceType,
      originalUrl,
      thumbnailUrl: thumbnailUrl || null,
      validationStatus: 'pending',
    });

    res.status(201).json({ success: true, media });
  } catch (error) {
    next(error);
  }
};

const deleteMedia = async (req, res, next) => {
  try {
    const media = await GigMedia.findById(req.params.id).populate('gig', 'provider');
    if (!media) return next(createError(404, 'Media not found.'));
    if (media.gig.provider.toString() !== req.user._id.toString()) return next(createError(403, 'Not authorized.'));

    await media.deleteOne();
    res.status(200).json({ success: true, message: 'Media deleted.' });
  } catch (error) {
    next(error);
  }
};

const getGigMedia = async (req, res, next) => {
  try {
    const media = await GigMedia.find({ gig: req.params.gigId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: media.length, media });
  } catch (error) {
    next(error);
  }
};

module.exports = { addMedia, deleteMedia, getGigMedia };
