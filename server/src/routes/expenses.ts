import { Router, Response, NextFunction } from 'express';
import { Expense } from '../models/Expense';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json({ expenses });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { description, amount, category, date, receipt } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({ error: 'Description, amount, and category are required' });
    }

    const expense = await Expense.create({
      description,
      amount: Number(amount),
      category,
      date: date || new Date(),
      receipt,
    });

    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
