const { z } = require("zod");
const Notification = require("../models/Notification");
const { sendEmail } = require("../utils/email");

const createNotificationSchema = z.object({
  body: z.object({
    audience: z.enum(["all", "student", "admin", "user"]).optional().default("all"),
    userId: z.string().optional().default(""),
    title: z.string().min(2),
    message: z.string().min(2),
    channel: z.enum(["inapp", "email", "whatsapp", "sms"]).optional().default("inapp")
  })
});

async function adminCreate(req, res, next) {
  try {
    const { audience, userId, title, message, channel } = req.validated.body;
    const notification = await Notification.create({
      audience,
      user: userId || null,
      title,
      message,
      channel
    });

    // Email is supported (optional). WhatsApp/SMS are placeholders.
    if (channel === "email" && userId) {
      // We'll attempt sending, but won't fail the request if SMTP isn't configured.
      const { ok } = await sendEmail({
        to: req.body.to || "", // optional override
        subject: title,
        html: `<p>${message}</p>`
      });
      notification.sent = ok;
      notification.sentAt = ok ? new Date() : null;
      await notification.save();
    }

    res.status(201).json({ notification });
  } catch (err) {
    next(err);
  }
}

async function myNotifications(req, res, next) {
  try {
    const rows = await Notification.find({
      $or: [
        { audience: "all" },
        { audience: req.user.role },
        { audience: "user", user: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { createNotificationSchema, adminCreate, myNotifications };

