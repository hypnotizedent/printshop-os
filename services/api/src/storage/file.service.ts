/**
 * File Storage Service
 * Handles file uploads to S3 or local storage
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // For MinIO compatibility
  forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  } : undefined,
});

const BUCKET_NAME = process.env.S3_BUCKET || 'printshop-files';
const USE_S3 = process.env.USE_S3 === 'true';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export interface FileMetadata {
  key: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  orderId?: string;
  customerId?: string;
  category?: 'artwork' | 'mockup' | 'proof' | 'document' | 'other';
}

/**
 * Generate unique file key
 */
function generateFileKey(filename: string, orderId?: string): string {
  const ext = path.extname(filename);
  const hash = crypto.randomBytes(8).toString('hex');
  const date = new Date().toISOString().split('T')[0];
  
  if (orderId) {
    return `orders/${orderId}/${date}-${hash}${ext}`;
  }
  return `uploads/${date}/${hash}${ext}`;
}

/**
 * Get content type from filename
 */
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ai': 'application/illustrator',
    '.eps': 'application/postscript',
    '.psd': 'image/vnd.adobe.photoshop',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Upload file to S3
 */
async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    return {
      success: true,
      key,
      url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
    };
  } catch (error: any) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload file to local storage
 */
async function uploadToLocal(
  buffer: Buffer,
  key: string
): Promise<UploadResult> {
  try {
    const filePath = path.join(LOCAL_STORAGE_PATH, key);
    const dir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.promises.writeFile(filePath, buffer);
    
    return {
      success: true,
      key,
      url: `/uploads/${key}`,
    };
  } catch (error: any) {
    console.error('Local upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload a file
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  options?: {
    orderId?: string;
    customerId?: string;
    category?: FileMetadata['category'];
  }
): Promise<UploadResult> {
  const key = generateFileKey(filename, options?.orderId);
  const contentType = getContentType(filename);

  if (USE_S3) {
    return uploadToS3(buffer, key, contentType);
  } else {
    return uploadToLocal(buffer, key);
  }
}

/**
 * Upload from base64 string
 */
export async function uploadBase64(
  base64Data: string,
  filename: string,
  options?: {
    orderId?: string;
    customerId?: string;
    category?: FileMetadata['category'];
  }
): Promise<UploadResult> {
  // Remove data URL prefix if present
  const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');
  
  return uploadFile(buffer, filename, options);
}

/**
 * Get a signed URL for temporary file access
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!USE_S3) {
    return `/uploads/${key}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return url;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return null;
  }
}

/**
 * Get a signed URL for uploading (presigned PUT)
 */
export async function getSignedUploadUrl(
  filename: string,
  orderId?: string,
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; key: string } | null> {
  if (!USE_S3) {
    return null; // Local uploads don't use presigned URLs
  }

  try {
    const key = generateFileKey(filename, orderId);
    const contentType = getContentType(filename);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return { uploadUrl, key };
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return null;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(key: string): Promise<boolean> {
  if (USE_S3) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return false;
    }
  } else {
    try {
      const filePath = path.join(LOCAL_STORAGE_PATH, key);
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Local delete error:', error);
      return false;
    }
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  if (USE_S3) {
    try {
      await s3Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  } else {
    try {
      const filePath = path.join(LOCAL_STORAGE_PATH, key);
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default {
  uploadFile,
  uploadBase64,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  deleteFile,
  fileExists,
};
