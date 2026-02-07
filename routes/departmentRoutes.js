const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, departmentController.getAllDepartments);
router.get('/:id', protect, departmentController.getDepartmentById);
router.post('/', protect, requireRole('ADMIN'), departmentController.createDepartment);
router.put('/:id', protect, requireRole('ADMIN'), departmentController.updateDepartment);
router.delete('/:id', protect, requireRole('ADMIN'), departmentController.deleteDepartment);

module.exports = router;
