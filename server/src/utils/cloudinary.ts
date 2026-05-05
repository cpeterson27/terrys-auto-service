import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadedGalleryFile {
  buffer: Buffer;
  mimetype: string;
}

const getCloudinaryUrl = () => process.env.CLOUDINARY_URL?.trim();
const getSeparateCloudinaryConfig = () => ({
  apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
  apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
  cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
});
const hasSeparateCloudinaryConfig = () => {
  const { apiKey, apiSecret, cloudName } = getSeparateCloudinaryConfig();
  return Boolean(apiKey && apiSecret && cloudName);
};
const parseCloudinaryUrl = (cloudinaryUrl: string) => {
  const parsedUrl = new URL(cloudinaryUrl);

  return {
    apiKey: decodeURIComponent(parsedUrl.username),
    apiSecret: decodeURIComponent(parsedUrl.password),
    cloudName: parsedUrl.hostname,
  };
};
const getCloudinaryCloudName = () => {
  const separateConfig = getSeparateCloudinaryConfig();

  if (hasSeparateCloudinaryConfig()) {
    return separateConfig.cloudName;
  }

  const cloudinaryUrl = getCloudinaryUrl();

  if (cloudinaryUrl) {
    return parseCloudinaryUrl(cloudinaryUrl).cloudName || 'configured Cloudinary URL';
  }

  return process.env.CLOUDINARY_CLOUD_NAME?.trim();
};

export const isCloudinaryConfigured = () =>
  Boolean(
    hasSeparateCloudinaryConfig() ||
    getCloudinaryUrl()
  );

const configureCloudinary = () => {
  const separateConfig = getSeparateCloudinaryConfig();

  if (hasSeparateCloudinaryConfig()) {
    cloudinary.config({
      cloud_name: separateConfig.cloudName,
      api_key: separateConfig.apiKey,
      api_secret: separateConfig.apiSecret,
      secure: true,
    });
    return;
  }

  const cloudinaryUrl = getCloudinaryUrl();

  if (cloudinaryUrl) {
    const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl(cloudinaryUrl);

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
    secure: true,
  });
};

export const getConfiguredCloudinaryName = () => getCloudinaryCloudName();
export const getConfiguredCloudinarySource = () => (
  hasSeparateCloudinaryConfig() ? 'separate CLOUDINARY_* variables' : 'CLOUDINARY_URL'
);

export const getCloudinaryErrorMessage = (error: any) => {
  const statusCode = error?.http_code || error?.statusCode || error?.status;
  const rawMessage = String(error?.message || '');

  if (statusCode === 401 || statusCode === 403 || rawMessage.includes('403')) {
    return `Cloudinary rejected the upload using ${getConfiguredCloudinarySource()}. The API key is valid, but it may be missing upload/create permissions. In Cloudinary, edit or regenerate the API key and make sure it can create/upload assets.`;
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
