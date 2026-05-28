const express = require("express");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const {
  createSeatSchema,
  bulkCreateSchema,
  assignSchema,
  listSeats,
  createSeat,
  bulkCreate,
  assignSeatToUser
} = require("../controllers/seatController");

const router = express.Router();

router.use(protect);

router.get("/", requireRole("admin", "student"), listSeats);
router.post("/", requireRole("admin"), validate(createSeatSchema), createSeat);
router.post("/bulk", requireRole("admin"), validate(bulkCreateSchema), bulkCreate);
router.post("/:seatId/assign", requireRole("admin"), validate(assignSchema), assignSeatToUser);

module.exports = router;

