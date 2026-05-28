const dotenv = require("dotenv");

dotenv.config();

const missing = [];

function getEnv(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") missing.push(name);
  return value || "";
}

const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGO_URI: getEnv("MONGO_URI", "mongodb://127.0.0.1:27017/studysync"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500",
  STATIC_QR_SECRET: getEnv("STATIC_QR_SECRET"),
  DYNAMIC_QR_SECRET: getEnv("DYNAMIC_QR_SECRET"),
  DYNAMIC_QR_WINDOW_SECONDS: Number(process.env.DYNAMIC_QR_WINDOW_SECONDS || 30),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 465),
  SMTP_SECURE: (process.env.SMTP_SECURE || "true") === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "StudySync <no-reply@studysync.local>"
};

function validateEnv() {
  // Remove duplicates while keeping the output readable.
  const uniq = Array.from(new Set(missing)).filter((k) => k && !["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].includes(k));
  if (uniq.length) {
    throw new Error(`Missing required env vars: ${uniq.join(", ")}`);
  }
}

module.exports = { env, validateEnv };
