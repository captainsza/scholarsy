import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload image to Cloudinary
export const uploadToCloudinary = async (imageBase64: string, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(imageBase64, {
      resource_type: 'image',
      ...options,
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

// Function to upload any file type to Cloudinary
export const uploadFileToCloudinary = async (fileBase64: string, fileType: string, options = {}) => {
  try {
    // Determine resource type based on file extension
    let resourceType = 'auto';
    if (fileType.includes('image')) {
      resourceType = 'image';
    } else if (fileType.includes('pdf') || fileType.includes('doc') || fileType.includes('xls') || fileType.includes('ppt')) {
      resourceType = 'raw';
    } else if (fileType.includes('video')) {
      resourceType = 'video';
    }

    const result = await cloudinary.uploader.upload(fileBase64, {
      resource_type: resourceType,
      ...options,
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: resourceType,
      format: result.format,
      originalFilename: options.originalFilename || 'file'
    };
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

// Function to delete resources from Cloudinary
export const deleteFromCloudinary = async (publicId: string, resourceType: string = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Error deleting resource from Cloudinary:', error);
    throw error;
  }
};
