import mongoose, { Schema, Document } from 'mongoose';
import { IInvoice } from '../types';

interface IInvoiceDocument extends Omit<IInvoice, '_id'>, Document {}

const invoiceItemSchema: Schema = new Schema({
  description: String,
  quantity: Number,
  unitPrice: Number,
  total: Number,
});

const invoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalAmount: Number,
    taxAmount: Number,
    subtotal: Number,
    items: [invoiceItemSchema],
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue'],
      default: 'draft',
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoiceDocument>('Invoice', invoiceSchema);
