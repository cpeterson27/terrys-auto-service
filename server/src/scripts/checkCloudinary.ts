import dotenv from 'dotenv';
import crypto from 'crypto';
import {
  deleteGalleryMedia,
  getCloudinaryErrorMessage,
  getConfiguredCloudinaryName,
  getConfiguredCloudinarySource,
  isCloudinaryConfigured,
  uploadGalleryMedia,
} from '../utils/cloudinary';

dotenv.config();

const run = async () => {
  const cloudName = getConfiguredCloudinaryName();

  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is missing CLOUDINARY_URL or the three separate CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET values.');
  }

  console.log(`Testing Cloudinary product environment: ${cloudName}`);
  console.log(`Using Cloudinary config source: ${getConfiguredCloudinarySource()}`);

  try {
    const pingUrl = `https://api.cloudinary.com/v1_1/${cloudName}/ping`;
    const auth = Buffer.from(
      `${process.env.CLOUDINARY_API_KEY?.trim()}:${process.env.CLOUDINARY_API_SECRET?.trim()}`
    ).toString('base64');
    const pingResponse = await fetch(pingUrl, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const pingBody = await pingResponse.text();

    console.log(`Cloudinary Admin API ping status: ${pingResponse.status}`);
    if (!pingResponse.ok) {
      console.log(`Cloudinary Admin API ping response: ${pingBody}`);
    }

    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'terrys-auto-service/diagnostics';
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
    const signature = crypto
      .createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'image/gif' }), 'diagnostic.gif');
    formData.append('folder', folder);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', process.env.CLOUDINARY_API_KEY?.trim() || '');
    formData.append('signature', signature);
    const rawUploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const rawUploadBody = await rawUploadResponse.text();

    console.log(`Cloudinary raw upload status: ${rawUploadResponse.status}`);
    if (!rawUploadResponse.ok) {
      console.log(`Cloudinary raw upload response: ${rawUploadBody}`);
    }

    const result = await uploadGalleryMedia({ buffer, mimetype: 'image/gif' });

    console.log('Cloudinary upload test succeeded.');
    console.log(`Uploaded resource type: ${result.resource_type}`);

    await deleteGalleryMedia(result.public_id, 'image');
    console.log('Diagnostic asset cleaned up.');
  } catch (error: any) {
    console.error(`Cloudinary error name: ${error?.name || 'unknown'}`);
    console.error(`Cloudinary error status: ${error?.http_code || error?.statusCode || error?.status || 'unknown'}`);
    console.error(`Cloudinary error message: ${error?.message || 'unknown'}`);
    if (error?.error?.message) {
      console.error(`Cloudinary nested message: ${error.error.message}`);
    }
    if (error?.response?.body) {
      console.error(`Cloudinary response body: ${JSON.stringify(error.response.body)}`);
    }
    console.error(getCloudinaryErrorMessage(error));
    process.exit(1);
  }
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
