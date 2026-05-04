const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

module.exports = { signToken };
