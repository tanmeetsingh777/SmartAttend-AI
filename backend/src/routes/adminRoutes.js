const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getUsers,
  createUser,
  updateUser,
  getDepartments,
  createDepartment,
  getAuditLogs,
} = require("../controllers/adminController");

router.use(protect, authorize("admin"));
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.get("/audit-logs", getAuditLogs);
module.exports = router;
