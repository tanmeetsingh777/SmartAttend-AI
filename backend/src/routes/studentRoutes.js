const express = require("express");
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  enrollStudentFace,
  getStudentEnrollment,
  deleteStudentEnrollment,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router
  .route("/")
  .get(getStudents)
  .post(authorize("admin", "hod", "teacher"), createStudent);

router
  .route("/:id")
  .get(getStudentById)
  .put(authorize("admin", "hod", "teacher"), updateStudent)
  .delete(authorize("admin", "hod", "teacher"), deleteStudent);

router.patch(
  "/:id/restore",
  authorize("admin", "hod", "teacher"),
  restoreStudent,
);

router
  .route("/:studentId/enrollment")
  .get(getStudentEnrollment)
  .post(authorize("admin", "hod", "teacher"), enrollStudentFace)
  .delete(authorize("admin", "hod", "teacher"), deleteStudentEnrollment);

module.exports = router;
