const express = require('express');
const router = express.Router();
const { getDashboardStats, getReports, exportCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/attendance', getReports);
router.get('/attendance/export', exportCSV);

module.exports = router;
