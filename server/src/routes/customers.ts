import { Router } from 'express';
import { deleteCustomer, listCustomers } from '../controllers/customerController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listCustomers);
router.delete('/:id', deleteCustomer);

export default router;
