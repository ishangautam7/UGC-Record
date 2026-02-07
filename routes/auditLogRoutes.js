const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, requireRole('ADMIN', 'AUDITOR'), auditLogController.getAllLogs);
router.get('/:entity/:entityId', protect, requireRole('ADMIN', 'AUDITOR'), auditLogController.getLogsByEntity);

module.exports = router;
