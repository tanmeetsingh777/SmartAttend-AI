const express = require("express");
const router = express.Router();
const {
  getClasses,
  getClassById,
  getAssignableTeachers,
  getAvailableDepartments,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/departments", getAvailableDepartments);
router.get("/teachers", authorize("admin", "hod", "teacher"), getAssignableTeachers);
router.route("/").get(getClasses).post(authorize("admin", "hod", "teacher"), createClass);

router
  .route("/:id")
  .get(getClassById)
  .put(authorize("admin", "hod", "teacher"), updateClass)
  .delete(authorize("admin", "hod"), deleteClass);

module.exports = router;

