const express = require("express");
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getClasses).post(authorize("admin", "hod"), createClass);

router
  .route("/:id")
  .get(getClassById)
  .put(authorize("admin", "hod"), updateClass)
  .delete(authorize("admin", "hod"), deleteClass);

module.exports = router;
