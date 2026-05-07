import { Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice';
import { AuthRequest } from '../middleware/auth';
import { calculateInvoiceTotal, generateInvoiceNumber } from '../utils/invoiceUtils';
import { User } from '../models/User';

export const listInvoices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { customerId: req.user?.userId };
    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ issuedDate: -1 });

    res.json({ invoices });
  } catch (error) {
    next(error);
  }
};

export const listInvoiceCustomers = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await User.find({
      role: 'customer',
      accountDeleted: { $ne: true },
    })
      .select('name email phone emailVerified createdAt')
      .sort({ name: 1, email: 1 });

    res.json({ customers });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId, items, dueDate, status, notes, taxRate } = req.body;

    if (!customerId || !Array.isArray(items) || items.length === 0 || !dueDate) {
      return res.status(400).json({ error: 'Customer, invoice items, and due date are required' });
    }

    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      return {
        description: item.description,
        quantity,
        unitPrice,
        total: Number((quantity * unitPrice).toFixed(2)),
      };
    });

    if (normalizedItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      return res.status(400).json({ error: 'Each invoice item needs a description, quantity, and price' });
    }

    const totals = calculateInvoiceTotal(normalizedItems, Number(taxRate ?? 0.0825));
    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      customerId,
      items: normalizedItems,
      dueDate,
      status: status || 'draft',
      notes,
      ...totals,
    });

    const populatedInvoice = await invoice.populate('customerId', 'name email phone');
    res.status(201).json({ invoice: populatedInvoice });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Invoice number already exists. Please try again.' });
    }

    next(error);
  }
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    if (!['draft', 'sent', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid invoice status' });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customerId', 'name email phone');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};
