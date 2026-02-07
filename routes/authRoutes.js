const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.post('/users', protect, requireRole('ADMIN', 'DEPARTMENT_HEAD'), authController.createUser);

module.exports = router;
