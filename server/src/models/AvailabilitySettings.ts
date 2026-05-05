import mongoose, { Schema, Document } from 'mongoose';

interface IAvailabilitySettingsDocument extends Document {
  serviceTimes: string[];
  bookableDays: number[];
  serviceStartTime: string;
  serviceEndTime: string;
  slotIntervalMinutes: number;
}

const availabilitySettingsSchema: Schema = new Schema(
  {
    serviceTimes: {
      type: [String],
      default: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'],
    },
    bookableDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5],
    },
    serviceStartTime: {
      type: String,
      default: '09:00',
    },
    serviceEndTime: {
      type: String,
      default: '15:00',
    },
    slotIntervalMinutes: {
      type: Number,
      default: 60,
    },
  },
  { timestamps: true }
);

export const AvailabilitySettings = mongoose.model<IAvailabilitySettingsDocument>(
  'AvailabilitySettings',
  availabilitySettingsSchema
);
