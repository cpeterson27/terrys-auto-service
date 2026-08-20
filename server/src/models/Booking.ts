import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from '../types';

interface IBookingDocument extends Omit<IBooking, '_id'>, Document {}

const bookingSchema: Schema = new Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    serviceTime: {
      type: String,
      required: true,
    },
    vehicleInfo: String,
    services: [{ type: String, trim: true }],
    description: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBookingDocument>('Booking', bookingSchema);
