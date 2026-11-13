const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/', healthController.getServicesHealth);
router.get('/db', healthController.getDatabaseHealth);
router.get('/kafka', healthController.getKafkaHealth);
router.get('/opensearch', healthController.getOpenSearchHealth);

module.exports = router;
