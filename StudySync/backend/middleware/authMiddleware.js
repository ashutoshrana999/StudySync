const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");
    const queryToken = typeof req.query.token === "string" ? req.query.token : "";
    const resolvedToken = type === "Bearer" && token ? token : queryToken;
    if (!resolvedToken) {
      res.status(401);
      throw new Error("Not authorized (missing token)");
    }

    const decoded = jwt.verify(resolvedToken, env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select("-passwordHash");
    if (!user) {
      res.status(401);
      throw new Error("Not authorized (user not found)");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error("Not authorized"));
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error("Forbidden"));
    }
    next();
  };
}

module.exports = { protect, requireRole };
