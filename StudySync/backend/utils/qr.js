const crypto = require("crypto");
const { env } = require("../config/env");

function getTimeSlice(unixSeconds, windowSeconds) {
  return Math.floor(unixSeconds / windowSeconds);
}

function makeDynamicQrCodePayload() {
  const now = Math.floor(Date.now() / 1000);
  const slice = getTimeSlice(now, env.DYNAMIC_QR_WINDOW_SECONDS);
  const sig = crypto
    .createHmac("sha256", env.DYNAMIC_QR_SECRET)
    .update(String(slice))
    .digest("hex");
  // Payload includes slice so backend can validate within a window.
  return `DYN:${slice}:${sig}`;
}

function validateDynamicQrPayload(payload) {
  if (typeof payload !== "string") return { ok: false, reason: "Invalid payload" };
  const parts = payload.split(":");
  if (parts.length !== 3 || parts[0] !== "DYN") return { ok: false, reason: "Invalid format" };

  const slice = Number(parts[1]);
  const sig = parts[2];
  if (!Number.isFinite(slice) || !sig) return { ok: false, reason: "Invalid content" };

  // Accept +/- 1 slice to tolerate minor clock skew.
  const now = Math.floor(Date.now() / 1000);
  const currentSlice = getTimeSlice(now, env.DYNAMIC_QR_WINDOW_SECONDS);
  const allowedSlices = [currentSlice - 1, currentSlice, currentSlice + 1];
  if (!allowedSlices.includes(slice)) return { ok: false, reason: "Expired QR" };

  const expected = crypto
    .createHmac("sha256", env.DYNAMIC_QR_SECRET)
    .update(String(slice))
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return { ok: false, reason: "Invalid signature" };
  }
  return { ok: true };
}

function makeStaticQrPayload() {
  // “Static” QR is a shared secret that must match env.
  return `STATIC:${env.STATIC_QR_SECRET}`;
}

function validateStaticQrPayload(payload) {
  if (typeof payload !== "string") return { ok: false, reason: "Invalid payload" };
  const prefix = "STATIC:";
  if (!payload.startsWith(prefix)) return { ok: false, reason: "Invalid format" };
  const secret = payload.slice(prefix.length);
  if (secret !== env.STATIC_QR_SECRET) return { ok: false, reason: "Invalid code" };
  return { ok: true };
}

module.exports = {
  makeDynamicQrCodePayload,
  validateDynamicQrPayload,
  makeStaticQrPayload,
  validateStaticQrPayload
};

