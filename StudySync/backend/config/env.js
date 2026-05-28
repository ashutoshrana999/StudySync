const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGO_URI: requireEnv("MONGO_URI", "mongodb://127.0.0.1:27017/studysync"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500",
  STATIC_QR_SECRET: requireEnv("STATIC_QR_SECRET"),
  DYNAMIC_QR_SECRET: requireEnv("DYNAMIC_QR_SECRET"),
  DYNAMIC_QR_WINDOW_SECONDS: Number(process.env.DYNAMIC_QR_WINDOW_SECONDS || 30),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 465),
  SMTP_SECURE: (process.env.SMTP_SECURE || "true") === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "StudySync <no-reply@studysync.local>"
};

module.exports = { env };

