import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryErrorMessage, isCloudinaryConfigured, uploadGalleryMedia } from '../utils/cloudinary';

dotenv.config();

const run = async () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  });

  console.log(`Testing Cloudinary product environment: ${cloudName}`);

  try {
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
    const result = await uploadGalleryMedia({ buffer, mimetype: 'image/gif' });

    console.log('Cloudinary upload test succeeded.');
    console.log(`Uploaded resource type: ${result.resource_type}`);

    await cloudinary.uploader.destroy(result.public_id, { resource_type: 'image' });
    console.log('Diagnostic asset cleaned up.');
  } catch (error: any) {
    console.error(`Cloudinary error name: ${error?.name || 'unknown'}`);
    console.error(`Cloudinary error status: ${error?.http_code || error?.statusCode || error?.status || 'unknown'}`);
    console.error(getCloudinaryErrorMessage(error));
    process.exit(1);
  }
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
