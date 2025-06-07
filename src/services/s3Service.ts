import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || 'AKIADUMMYKEY123',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || 'dummysecretkey456789abcdef',
  },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'aldous-dummy-uploads';

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  publicUrl?: string;
}

export interface DeleteResponse {
  success: boolean;
  error?: string;
}

/**
 * Upload file directly to S3 (for server-side uploads)
 */
export async function uploadFileToS3(
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<UploadResponse> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `agent-icons/${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read', // Make the file publicly accessible
    });

    await s3Client.send(command);

    // Return the public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`;
    
    return {
      success: true,
      url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate a presigned URL for client-side uploads
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<UploadResponse> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `agent-icons/${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    // Return both the presigned URL and the final public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`;

    return {
      success: true,
      url: signedUrl,
      publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete file from S3
 */
export async function deleteFileFromS3(key: string): Promise<DeleteResponse> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Mock upload function for development/testing
 * This simulates an S3 upload without actually making network calls
 */
export function mockUploadToS3(fileName: string): UploadResponse {
  const timestamp = Date.now();
  const uniqueFileName = `agent-icons/${timestamp}-${fileName}`;
  const mockUrl = `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`;
  
  return {
    success: true,
    url: mockUrl,
  };
}
