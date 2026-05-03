import mongoose, { Schema, Document } from 'mongoose';
import { IExpense } from '../types';

interface IExpenseDocument extends Omit<IExpense, '_id'>, Document {}

const expenseSchema: Schema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    receipt: String,
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpenseDocument>('Expense', expenseSchema);
