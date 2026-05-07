import { Router } from 'express';
import {
  createInvoice,
  listInvoiceCustomers,
  listInvoices,
  updateInvoiceStatus,
} from '../controllers/invoiceController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', listInvoices);
router.get('/customers', adminMiddleware, listInvoiceCustomers);
router.post('/', adminMiddleware, createInvoice);
router.patch('/:id/status', adminMiddleware, updateInvoiceStatus);

export default router;
