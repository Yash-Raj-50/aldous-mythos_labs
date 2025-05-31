'use server';

import { uploadFileToS3, mockUploadToS3, type UploadResponse } from '@/services/s3Service';

/**
 * Server action to handle file uploads to S3
 */
export async function uploadAgentIcon(formData: FormData): Promise<UploadResponse> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      };
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size must be less than 2MB.',
      };
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // In development, use mock upload to avoid actual S3 calls
    if (process.env.NODE_ENV === 'development') {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockUploadToS3(file.name);
    }

    // In production, use actual S3 upload
    return await uploadFileToS3(buffer, file.name, file.type);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
