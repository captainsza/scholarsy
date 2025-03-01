/**
 * Uploads a file to Cloudinary directly from the server-side
 * @param file Base64 encoded file data
 * @returns URL of the uploaded image
 */
export async function uploadToCloudinary(file: string): Promise<string> {
  try {
    // Make sure we have a base64 string
    if (!file.startsWith('data:')) {
      throw new Error('Invalid file format. Expected base64 data URI.');
    }
    
    // For server-side use, we need to use the full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: file }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * This function is a client-side placeholder for deleting images
 */
export async function deleteFromCloudinary(url: string): Promise<void> {
  // In a client environment, we'd call an API route
  console.log('Would delete image URL:', url);
}
