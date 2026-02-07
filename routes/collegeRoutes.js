const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, collegeController.getAllColleges);
router.get('/:id', protect, collegeController.getCollegeById);
router.post('/', protect, requireRole('ADMIN'), collegeController.createCollege);
router.put('/:id', protect, requireRole('ADMIN'), collegeController.updateCollege);
router.delete('/:id', protect, requireRole('ADMIN'), collegeController.deleteCollege);

module.exports = router;
