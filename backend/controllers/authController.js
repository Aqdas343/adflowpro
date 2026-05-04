const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const { signToken } = require('../utils/tokenUtils');
const { createError } = require('../utils/errorUtils');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const privileged = ['admin', 'moderator', 'super_admin'];
    const safeRole = privileged.includes(role) ? 'client' : (role || 'client');
    const roleDowngraded = privileged.includes(role);

    const existing = await User.findOne({ email });
    if (existing) return next(createError(409, 'An account with this email already exists.'));

    const user = await User.create({ name, email, password, role: safeRole, authProvider: 'local' });

    if (safeRole === 'provider') {
      await ProviderProfile.create({ user: user._id });
    }

    const token = signToken(user);
    res.status(201).json({
      success: true,
      message: roleDowngraded
        ? 'Account created successfully. Privileged roles cannot be self-assigned; your role has been set to client.'
        : 'Account created successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return next(createError(401, 'Invalid email or password.'));

    if (user.status !== 'active') return next(createError(403, 'Your account has been suspended or banned.'));

    if (user.authProvider === 'google') {
      return next(createError(400, 'This account uses Google Sign-In. Please login with Google.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(createError(401, 'Invalid email or password.'));

    const token = signToken(user);
    res.status(200).json({ success: true, message: 'Logged in successfully.', token, user });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res) => {
  try {
    const token = signToken(req.user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/oauth/callback?token=${token}`);
  } catch {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
};

module.exports = { register, login, getMe, googleCallback };
