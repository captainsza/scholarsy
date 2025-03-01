import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with just the basic credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const runtime = 'nodejs'; // Mark as Node.js runtime

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Simple upload - no preset or folder specification
    const result = await cloudinary.uploader.upload(image, {
      // Just resize to save space
      transformation: [
        { width: 400, height: 400, crop: 'limit' }
      ]
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Error uploading image' },
      { status: 500 }
    );
  }
}
