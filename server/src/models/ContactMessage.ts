import mongoose, { Schema, Document } from 'mongoose';

interface IContactMessageDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  replies: Array<{ body: string; sentAt: Date; sentBy?: string }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const contactMessageSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'archived'],
      default: 'new',
    },
    replies: [{
      _id: false,
      body: { type: String, required: true, trim: true },
      sentAt: { type: Date, required: true },
      sentBy: { type: String, trim: true },
    }],
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model<IContactMessageDocument>('ContactMessage', contactMessageSchema);
