const express = require("express");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { upload } = require("../middleware/upload");
const {
  createStudentSchema,
  updateStudentSchema,
  seatAssignSchema,
  dashboard,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadProfileImage,
  assignSeat,
  unassignSeat,
  getStaticQr,
  getDynamicQr
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, requireRole("admin"));

router.get("/dashboard", dashboard);

router.get("/students", listStudents);
router.post("/students", validate(createStudentSchema), createStudent);
router.patch("/students/:id", validate(updateStudentSchema), updateStudent);
router.delete("/students/:id", deleteStudent);

router.post("/students/:id/profile-image", upload.single("image"), uploadProfileImage);
router.post("/students/:id/assign-seat", validate(seatAssignSchema), assignSeat);
router.post("/students/:id/unassign-seat", unassignSeat);

router.get("/qr/static", getStaticQr);
router.get("/qr/dynamic", getDynamicQr);

module.exports = router;

