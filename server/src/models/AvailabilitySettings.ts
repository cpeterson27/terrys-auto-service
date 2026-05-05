import mongoose, { Schema, Document } from 'mongoose';

interface IAvailabilitySettingsDocument extends Document {
  serviceTimes: string[];
}

const availabilitySettingsSchema: Schema = new Schema(
  {
    serviceTimes: {
      type: [String],
      default: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'],
    },
  },
  { timestamps: true }
);

export const AvailabilitySettings = mongoose.model<IAvailabilitySettingsDocument>(
  'AvailabilitySettings',
  availabilitySettingsSchema
);
