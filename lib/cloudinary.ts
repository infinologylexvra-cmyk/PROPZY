import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Generates a signed upload signature for secure direct client-to-Cloudinary uploads.
 * This ensures credentials (API Secret) remain on the server, while allowing fast browser uploads.
 */
export function generateUploadSignature(paramsToSign: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error('CLOUDINARY_API_SECRET is not configured in environment variables');
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  return signature;
}

/**
 * Extracts Cloudinary public_id from a secure Cloudinary image URL.
 * Example URL:
 * https://res.cloudinary.com/tyuautgp/image/upload/v1723981234/letsrentz/properties/photo_abc123.jpg
 * Returns: letsrentz/properties/photo_abc123
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return null;
  }

  try {
    // Matches path after /upload/ (skipping version like /v12345/ if present, and transformations)
    const matches = url.match(/\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?([^\.]+)/);
    if (matches && matches[1]) {
      return matches[1];
    }
  } catch (err) {
    console.warn('Failed to extract public_id from Cloudinary URL:', url, err);
  }

  return null;
}

/**
 * Automatically uploads any Base64 data URLs in an image array to Cloudinary
 * and returns the array with all Base64 strings replaced with secure HTTPS Cloudinary URLs.
 */
export async function uploadBase64ImagesToCloudinary(images: string[], folder = 'letsrentz/properties'): Promise<string[]> {
  if (!Array.isArray(images) || images.length === 0) return [];

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  const processedImages: string[] = [];

  for (const img of images) {
    if (typeof img === 'string' && img.startsWith('data:image/')) {
      if (isConfigured) {
        try {
          const res = await cloudinary.uploader.upload(img, {
            folder,
            resource_type: 'image',
          });
          if (res?.secure_url) {
            processedImages.push(res.secure_url);
            continue;
          }
        } catch (uploadErr: any) {
          console.error('[Cloudinary Auto-Upload Error]:', uploadErr?.message);
        }
      }
      // If upload failed or not configured, keep img
      processedImages.push(img);
    } else if (typeof img === 'string' && img.trim().length > 0) {
      processedImages.push(img.trim());
    }
  }

  return processedImages;
}

/**
 * Safely destroys an image on Cloudinary by its publicId.
 */
export async function deleteCloudinaryImage(publicId: string) {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error: any) {
    console.warn(`[Cloudinary] Failed to delete image ${publicId}:`, error.message);
    return null;
  }
}

export default cloudinary;

