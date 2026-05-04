import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadedGalleryFile {
  buffer: Buffer;
  mimetype: string;
}

export const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export const uploadGalleryMedia = (file: UploadedGalleryFile): Promise<UploadApiResponse> => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'terrys-auto-service/gallery',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

export const getVideoThumbnailUrl = (publicId: string) =>
  cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [{ width: 900, height: 506, crop: 'fill' }],
  });

export const deleteGalleryMedia = async (publicId: string, mediaType: 'image' | 'video') => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: mediaType,
  });
};
