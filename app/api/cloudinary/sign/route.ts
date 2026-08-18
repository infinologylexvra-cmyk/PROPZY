import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateUploadSignature } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login to upload property images.' },
        { status: 401 }
      );
    }

    if (authUser.role === 'tenant') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Tenants cannot post property listings.' },
        { status: 403 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary is not properly configured on server.' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'letsrentz/properties';

    // Parameters to sign must match exactly the parameters sent in the upload request
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = generateUploadSignature(paramsToSign);

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary upload signature:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
