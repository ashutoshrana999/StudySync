const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signJwtForUser(user) {
  return jwt.sign(
    { role: user.role, email: user.email },
    env.JWT_SECRET,
    { subject: String(user._id), expiresIn: env.JWT_EXPIRES_IN }
  );
}

module.exports = { signJwtForUser };

