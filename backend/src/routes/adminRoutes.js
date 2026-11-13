const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdminKey } = require('../middleware/authMiddleware');

router.get('/stats', requireAdminKey, adminController.getAdminDashboardStats);
router.get('/kafka-logs', requireAdminKey, adminController.getKafkaLogs);
router.post('/reset', requireAdminKey, adminController.resetData);

module.exports = router;
