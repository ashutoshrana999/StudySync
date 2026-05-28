const express = require("express");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const {
  createPaymentSchema,
  adminCreatePayment,
  adminListPayments,
  myPayments,
  dueSummary,
  downloadInvoice
} = require("../controllers/paymentController");

const router = express.Router();

router.use(protect);

router.get("/me", requireRole("student", "admin"), myPayments);
router.get("/me/due", requireRole("student", "admin"), dueSummary);
router.get("/:paymentId/invoice", downloadInvoice);

router.post("/", requireRole("admin"), validate(createPaymentSchema), adminCreatePayment);
router.get("/", requireRole("admin"), adminListPayments);

module.exports = router;

