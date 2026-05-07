import { Router } from 'express';
import { createExpense, deleteExpense, listExpenses } from '../controllers/expenseController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
