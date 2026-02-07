const express = require('express');
const router = express.Router();
const researcherController = require('../controllers/researcherController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, researcherController.getAllResearchers);
router.get('/me', protect, researcherController.getMyProfile);
router.get('/:id', protect, researcherController.getResearcherById);
router.post('/', protect, requireRole('DEPARTMENT_HEAD'), researcherController.createResearcherProfile);
router.put('/:id', protect, requireRole('DEPARTMENT_HEAD'), researcherController.updateResearcherProfile);

module.exports = router;
