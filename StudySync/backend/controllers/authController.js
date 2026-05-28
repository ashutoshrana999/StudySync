const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("../models/User");
const { signJwtForUser } = require("../utils/jwt");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().default(""),
    password: z.string().min(6),
    remember: z.boolean().optional().default(true)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    remember: z.boolean().optional().default(true)
  })
});

async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.validated.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(409);
      throw new Error("Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      role: "student",
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      passwordHash,
      active: true
    });

    const token = signJwtForUser(user);
    res.status(201).json({
      token,
      user: { id: user._id, role: user.role, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
    if (!user.active) {
      res.status(403);
      throw new Error("Account is inactive. Contact admin.");
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signJwtForUser(user);
    res.json({
      token,
      user: { id: user._id, role: user.role, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { registerSchema, loginSchema, register, login, me };

