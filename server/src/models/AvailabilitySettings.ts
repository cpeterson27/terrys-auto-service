import mongoose, { Schema, Document } from 'mongoose';

interface IAvailabilitySettingsDocument extends Document {
  serviceTimes: string[];
  bookableDays: number[];
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
  },
  { timestamps: true }
);

export const AvailabilitySettings = mongoose.model<IAvailabilitySettingsDocument>(
  'AvailabilitySettings',
  availabilitySettingsSchema
);
