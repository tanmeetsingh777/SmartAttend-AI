const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createRequest,
  getRequests,
  reviewRequest,
} = require("../controllers/correctionController");

router.use(protect);
router.post("/", authorize("teacher", "hod"), createRequest);
router.get("/", authorize("admin", "hod"), getRequests);
router.put("/:id", authorize("admin", "hod"), reviewRequest);
module.exports = router;
