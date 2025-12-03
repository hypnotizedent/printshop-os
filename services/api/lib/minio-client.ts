/**
 * MinIO Client Wrapper
 * 
 * Provides a simplified interface for interacting with MinIO object storage.
 * Used for archiving Printavo data and files.
 */

import { Client } from 'minio';
import * as fs from 'fs';
import * as path from 'path';

export interface MinIOConfig {
  endpoint: string;
  port?: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export class MinIOUploader {
  private client: Client;
  private bucket: string;

  constructor(config: MinIOConfig) {
    // Parse endpoint to extract host and port
    const [host, portStr] = config.endpoint.split(':');
    const port = config.port || (portStr ? parseInt(portStr, 10) : (config.useSSL ? 443 : 9000));

    this.client = new Client({
      endPoint: host,
      port: port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    
    this.bucket = config.bucket;
  }

  /**
   * Ensure the bucket exists, create it if it doesn't
   */
  async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, '');
        console.log(`✅ Created bucket: ${this.bucket}`);
      } else {
        console.log(`✓ Bucket exists: ${this.bucket}`);
      }
    } catch (error) {
      throw new Error(`Failed to ensure bucket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload a file from local filesystem to MinIO
   */
  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    try {
      if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${localPath}`);
      }

      const stat = fs.statSync(localPath);
      const metaData = {
        'Content-Type': this.getContentType(localPath),
        'Content-Length': stat.size,
      };

      await this.client.fPutObject(this.bucket, remotePath, localPath, metaData);
    } catch (error) {
      throw new Error(`Failed to upload file ${localPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload JSON data to MinIO
   */
  async uploadJSON(data: unknown, remotePath: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonString, 'utf-8');
      
      const metaData = {
        'Content-Type': 'application/json',
        'Content-Length': buffer.length,
      };

      await this.client.putObject(this.bucket, remotePath, buffer, buffer.length, metaData);
    } catch (error) {
      throw new Error(`Failed to upload JSON to ${remotePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List objects with a given prefix
   */
  async listObjects(prefix: string): Promise<string[]> {
    const objects: string[] = [];
    
    return new Promise((resolve, reject) => {
      const stream = this.client.listObjects(this.bucket, prefix, true);
      
      stream.on('data', (obj) => {
        if (obj.name) {
          objects.push(obj.name);
        }
      });
      
      stream.on('error', (err) => {
        reject(new Error(`Failed to list objects: ${err.message}`));
      });
      
      stream.on('end', () => {
        resolve(objects);
      });
    });
  }

  /**
   * Get a presigned URL for temporary access to an object
   */
  async getPresignedUrl(objectPath: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      return await this.client.presignedGetObject(this.bucket, objectPath, expiry);
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if an object exists
   */
  async objectExists(objectPath: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, objectPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(objectPath: string): Promise<{ size: number; etag: string; lastModified: Date }> {
    try {
      const stat = await this.client.statObject(this.bucket, objectPath);
      return {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
      };
    } catch (error) {
      throw new Error(`Failed to get object metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(objectPath: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectPath);
    } catch (error) {
      throw new Error(`Failed to delete object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ai': 'application/postscript',
      '.eps': 'application/postscript',
      '.dst': 'application/octet-stream',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
}

/**
 * Load MinIO configuration from environment variables
 */
export function loadMinIOConfig(): MinIOConfig {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
  const accessKey = process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin';
  const secretKey = process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin';
  const bucket = process.env.MINIO_BUCKET || 'printshop';
  const useSSL = process.env.MINIO_USE_SSL === 'true';

  return {
    endpoint,
    useSSL,
    accessKey,
    secretKey,
    bucket,
  };
}
