const express = require("express");
const router = express.Router();
const {
  startSession,
  getSessions,
  getSessionById,
  recognizeAndMarkAttendance,
  manualAttendance,
  updateRecord,
  finalizeSession,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/sessions", authorize("admin", "hod", "teacher"), startSession);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionById);
router.post(
  "/sessions/:id/recognize",
  authorize("admin", "hod", "teacher"),
  recognizeAndMarkAttendance,
);
router.post(
  "/sessions/:id/manual",
  authorize("admin", "hod", "teacher"),
  manualAttendance,
);
router.put("/records/:id", authorize("admin", "hod", "teacher"), updateRecord);
router.post(
  "/sessions/:id/finalize",
  authorize("admin", "hod", "teacher"),
  finalizeSession,
);

module.exports = router;
