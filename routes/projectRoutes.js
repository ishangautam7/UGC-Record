const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/stats', protect, projectController.getProjectStats);
router.get('/', protect, projectController.getAllProjects);
router.get('/my', protect, projectController.getMyProjects);
router.get('/:id', protect, projectController.getProjectById);

router.post('/', protect, requireRole('RESEARCHER', 'DEPARTMENT_HEAD', 'ADMIN'), projectController.createProject);
router.put('/:id', protect, requireRole('RESEARCHER', 'DEPARTMENT_HEAD', 'ADMIN'), projectController.updateProject);

router.patch('/:id/status', protect, requireRole('DEPARTMENT_HEAD', 'ADMIN'), projectController.updateProjectStatus);

router.delete('/:id', protect, requireRole('ADMIN'), projectController.deleteProject);

router.post('/:id/members', protect, requireRole('RESEARCHER', 'DEPARTMENT_HEAD'), projectController.addProjectMember);
router.delete('/:id/members/:userId', protect, requireRole('RESEARCHER', 'DEPARTMENT_HEAD'), projectController.removeProjectMember);

module.exports = router;
