const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, roleController.getAllRoles);
router.get('/:id', protect, roleController.getRoleById);
router.post('/', protect, requireRole('ADMIN'), roleController.createRole);
router.put('/:id', protect, requireRole('ADMIN'), roleController.updateRole);
router.delete('/:id', protect, requireRole('ADMIN'), roleController.deleteRole);
router.post('/assign', protect, requireRole('ADMIN'), roleController.assignRoleToUser);
router.post('/remove', protect, requireRole('ADMIN'), roleController.removeRoleFromUser);

module.exports = router;
