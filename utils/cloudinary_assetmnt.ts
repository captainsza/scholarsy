import { v2 as cloudinary } from 'cloudinary';

// Initialize cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

/**
 * Upload a file to Cloudinary
 * @param fileDataUri The file to upload as a data URI
 * @param fileName Optional filename for reference (without extension)
 * @param folder Optional folder path
 * @returns Promise that resolves to Cloudinary upload result
 */
export const uploadToCloudinary = async (
  fileDataUri: string,
  fileName = 'file',
  folder = 'scholarsync'
): Promise<CloudinaryUploadResult> => {
  try {
    // Log the upload attempt (without the actual file data)
    console.log(`Starting Cloudinary upload for ${fileName} to folder ${folder}`);
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileDataUri, {
      resource_type: 'auto',
      folder,
      public_id: `${fileName}_${Date.now()}`,
      transformation: [
        { quality: 'auto' }
      ]
    });

    console.log(`Upload successful. Public ID: ${result.public_id}`);
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url
    };
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete a file from Cloudinary
 * @param publicId The public ID of the file to delete
 * @returns Promise that resolves when delete completes
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    console.log(`Deleting file from Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
    return false;
  }
};
