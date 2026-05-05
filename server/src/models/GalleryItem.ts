import mongoose, { Schema, Document } from 'mongoose';
import { IGalleryItem } from '../types';

interface IGalleryItemDocument extends Omit<IGalleryItem, '_id'>, Document {}

const galleryItemSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Auto Service',
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: '',
    },
    additionalMedia: {
      type: [
        {
          mediaType: {
            type: String,
            enum: ['image', 'video'],
            required: true,
          },
          mediaUrl: {
            type: String,
            required: true,
            trim: true,
          },
          thumbnailUrl: {
            type: String,
            default: '',
            trim: true,
          },
          cloudinaryPublicId: {
            type: String,
            default: '',
          },
        },
      ],
      default: [],
    },
    featured: {
      type: Boolean,
      default: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const GalleryItem = mongoose.model<IGalleryItemDocument>('GalleryItem', galleryItemSchema);
