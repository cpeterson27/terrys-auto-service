import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadedGalleryFile {
  buffer: Buffer;
  mimetype: string;
}

export const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  });
};

export const getCloudinaryErrorMessage = (error: any) => {
  const statusCode = error?.http_code || error?.statusCode || error?.status;
  const rawMessage = String(error?.message || '');

  if (statusCode === 401 || statusCode === 403 || rawMessage.includes('403')) {
    return 'Cloudinary rejected the upload. Check that CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on Render all come from the same Cloudinary product environment and have no extra spaces.';
  }

  return rawMessage || 'Cloudinary upload failed';
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

    uploadStream.end(file.buffer);
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
