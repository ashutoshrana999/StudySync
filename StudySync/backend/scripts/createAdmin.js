const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { env } = require("../config/env");
const User = require("../models/User");

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars.");
    process.exit(1);
  }

  await mongoose.connect(env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    role: "admin",
    name,
    email: email.toLowerCase(),
    passwordHash,
    active: true
  });

  // eslint-disable-next-line no-console
  console.log("Created admin:", email);
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

