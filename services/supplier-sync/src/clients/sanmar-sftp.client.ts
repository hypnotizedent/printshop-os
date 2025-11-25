import Client from 'ssh2-sftp-client';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface SanMarSFTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  remoteDirectory: string;
  localDirectory?: string;
}

export interface SanMarProductFile {
  filename: string;
  type: 'SDL_N' | 'EPDD' | 'DIP' | 'OTHER';
  lastModified: Date;
  size: number;
}

/**
 * SanMar SFTP Client
 * 
 * Downloads product data files from SanMar's SFTP server.
 * Key files:
 * - SanMar_SDL_N: Main product data (descriptions, pricing, weight)
 * - SanMar_EPDD: Enhanced data (inventory, categories, subcategories)
 * - sanmar_dip.txt: Hourly inventory updates (recommended for real-time inventory)
 */
export class SanMarSFTPClient {
  private config: SanMarSFTPConfig;
  private client: Client;
  private localDirectory: string;

  constructor(config: SanMarSFTPConfig) {
    this.config = config;
    this.client = new Client();
    this.localDirectory = config.localDirectory || '/tmp/sanmar-data';
  }

  /**
   * Connect to SanMar SFTP server
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
      });
      logger.info('Connected to SanMar SFTP server');
    } catch (error) {
      logger.error('Failed to connect to SanMar SFTP', { error });
      throw error;
    }
  }

  /**
   * Disconnect from SFTP server
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.end();
      logger.info('Disconnected from SanMar SFTP server');
    } catch (error) {
      logger.error('Error disconnecting from SFTP', { error });
    }
  }

  /**
   * List all available files in the SanmarPDD directory
   */
  async listFiles(): Promise<SanMarProductFile[]> {
    try {
      // Try listing the configured directory first
      let fileList;
      try {
        fileList = await this.client.list(this.config.remoteDirectory);
      } catch (error: any) {
        // If configured directory doesn't exist, try root
        logger.warn('Configured directory not found, trying root', { 
          directory: this.config.remoteDirectory 
        });
        fileList = await this.client.list('/');
      }
      
      return fileList
        .filter((file: any) => file.type === '-') // Only files, not directories
        .map((file: any) => ({
          filename: file.name,
          type: this.detectFileType(file.name),
          lastModified: new Date(file.modifyTime),
          size: file.size,
        }))
        .sort((a: any, b: any) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      logger.error('Failed to list SFTP files', { error });
      throw error;
    }
  }

  /**
   * Download a specific file from SFTP server
   */
  async downloadFile(remoteFilename: string, localFilename?: string): Promise<string> {
    try {
      // Ensure local directory exists
      await fs.mkdir(this.localDirectory, { recursive: true });

      const remotePath = path.join(this.config.remoteDirectory, remoteFilename);
      const localPath = path.join(
        this.localDirectory,
        localFilename || remoteFilename
      );

      logger.info('Downloading file from SanMar SFTP', {
        remote: remotePath,
        local: localPath,
      });

      await this.client.get(remotePath, localPath);

      logger.info('File downloaded successfully', {
        file: remoteFilename,
        size: (await fs.stat(localPath)).size,
      });

      return localPath;
    } catch (error) {
      logger.error('Failed to download file', { file: remoteFilename, error });
      throw error;
    }
  }

  /**
   * Download the main product data file (SDL_N)
   * Contains: Product descriptions, pricing, weight
   */
  async downloadMainProductFile(): Promise<string> {
    const files = await this.listFiles();
    const sdlFile = files.find((f) => f.type === 'SDL_N');

    if (!sdlFile) {
      throw new Error('SanMar_SDL_N file not found on SFTP server');
    }

    return this.downloadFile(sdlFile.filename);
  }

  /**
   * Download the enhanced product data file (EPDD)
   * Contains: Bulk inventory, categories, subcategories
   * Prefers CSV over ZIP for easier parsing
   */
  async downloadEnhancedProductFile(): Promise<string> {
    const files = await this.listFiles();
    
    // Look for uncompressed CSV file first (SanMar_EPDD.csv)
    const epddFile = files.find((f) => 
      f.filename === 'SanMar_EPDD.csv'
    ) || files.find((f) => 
      f.type === 'EPDD' && f.filename.toLowerCase().endsWith('.csv') && !f.filename.includes('.zip')
    ) || files.find((f) => f.type === 'EPDD');

    if (!epddFile) {
      throw new Error('SanMar_EPDD file not found on SFTP server');
    }

    logger.info('Selected EPDD file', { filename: epddFile.filename });
    return this.downloadFile(epddFile.filename);
  }

  /**
   * Download the hourly inventory file (DIP)
   * Updated hourly - best for real-time inventory
   */
  async downloadInventoryFile(): Promise<string> {
    const files = await this.listFiles();
    const dipFile = files.find((f) => f.type === 'DIP' || f.filename === 'sanmar_dip.txt');

    if (!dipFile) {
      throw new Error('sanmar_dip.txt file not found on SFTP server');
    }

    return this.downloadFile(dipFile.filename);
  }

  /**
   * Download all product data files
   */
  async downloadAllFiles(): Promise<{
    mainProduct: string;
    enhancedProduct: string;
    inventory: string;
  }> {
    try {
      const [mainProduct, enhancedProduct, inventory] = await Promise.all([
        this.downloadMainProductFile(),
        this.downloadEnhancedProductFile(),
        this.downloadInventoryFile(),
      ]);

      return { mainProduct, enhancedProduct, inventory };
    } catch (error) {
      logger.error('Failed to download all files', { error });
      throw error;
    }
  }

  /**
   * Parse CSV file and return records
   */
  async parseCSVFile<T = any>(filePath: string, options?: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const records: T[] = [];
      
      createReadStream(filePath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            ...options,
          })
        )
        .on('data', (record) => records.push(record))
        .on('end', () => {
          logger.info('CSV file parsed successfully', {
            file: path.basename(filePath),
            records: records.length,
          });
          resolve(records);
        })
        .on('error', (error) => {
          logger.error('Failed to parse CSV file', { file: filePath, error });
          reject(error);
        });
    });
  }

  /**
   * Get the last modified time of the inventory file
   * Used to determine if a new download is needed
   */
  async getInventoryFileLastModified(): Promise<Date> {
    const files = await this.listFiles();
    const dipFile = files.find((f) => f.type === 'DIP');

    if (!dipFile) {
      throw new Error('Inventory file not found');
    }

    return dipFile.lastModified;
  }

  /**
   * Check if local file needs to be updated
   */
  async needsUpdate(remoteFilename: string, localPath: string): Promise<boolean> {
    try {
      const files = await this.listFiles();
      const remoteFile = files.find((f) => f.filename === remoteFilename);

      if (!remoteFile) {
        return true;
      }

      // Check if local file exists
      try {
        const localStat = await fs.stat(localPath);
        // Compare modification times
        return remoteFile.lastModified.getTime() > localStat.mtime.getTime();
      } catch {
        // Local file doesn't exist
        return true;
      }
    } catch (error) {
      logger.error('Error checking file update status', { error });
      return true; // Default to updating if check fails
    }
  }

  /**
   * Detect file type based on filename
   */
  private detectFileType(filename: string): SanMarProductFile['type'] {
    const lower = filename.toLowerCase();
    
    if (lower === 'sanmar_dip.txt' || lower.includes('_dip')) return 'DIP';
    if (lower.includes('sdl_n')) return 'SDL_N';
    if (lower.includes('epdd')) return 'EPDD';
    
    return 'OTHER';
  }

  /**
   * Health check - verify SFTP connection and file availability
   */
  async healthCheck(): Promise<{
    connected: boolean;
    filesAvailable: boolean;
    fileCount: number;
    lastInventoryUpdate?: Date;
  }> {
    try {
      await this.connect();
      const files = await this.listFiles();
      const inventoryFile = files.find((f) => f.type === 'DIP');

      await this.disconnect();

      return {
        connected: true,
        filesAvailable: files.length > 0,
        fileCount: files.length,
        lastInventoryUpdate: inventoryFile?.lastModified,
      };
    } catch (error) {
      logger.error('SFTP health check failed', { error });
      return {
        connected: false,
        filesAvailable: false,
        fileCount: 0,
      };
    }
  }
}
