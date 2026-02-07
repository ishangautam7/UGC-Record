const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, userController.getAllUsers);
router.get('/:id', protect, userController.getUserById);
router.put('/:id', protect, requireRole('ADMIN'), userController.updateUser);
router.patch('/:id/toggle-status', protect, requireRole('ADMIN'), userController.toggleUserStatus);
router.delete('/:id', protect, requireRole('ADMIN'), userController.deleteUser);

module.exports = router;
