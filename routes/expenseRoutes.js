const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/stats', protect, expenseController.getExpenseStats);
router.get('/', protect, expenseController.getAllExpenses);
router.get('/my', protect, expenseController.getMyExpenses);
router.get('/project/:projectId', protect, expenseController.getExpensesByProject);
router.get('/:id', protect, expenseController.getExpenseById);

router.post('/', protect, requireRole('RESEARCHER', 'DEPARTMENT_HEAD'), expenseController.createExpense);

router.patch('/:id/status', protect, requireRole('DEPARTMENT_HEAD', 'ADMIN'), expenseController.updateExpenseStatus);

router.delete('/:id', protect, requireRole('ADMIN', 'RESEARCHER'), expenseController.deleteExpense);

module.exports = router;
