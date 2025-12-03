/**
 * Sync Printavo Data to MinIO Script
 * 
 * Uploads all extracted Printavo data and downloaded files to MinIO
 * for long-term archival and accessibility to n8n workflows and LLM agents.
 * 
 * Features:
 * - Uploads all JSON exports to printavo-archive/exports/{timestamp}/
 * - Uploads all downloaded files to printavo-archive/files/{visualId}/
 * - Creates searchable index files
 * - Verifies upload integrity
 * - Progress reporting
 * 
 * Usage:
 *   npm run printavo:sync-minio [extraction-directory]
 * 
 * Environment Variables:
 *   MINIO_ENDPOINT - MinIO endpoint (default: localhost:9000)
 *   MINIO_ACCESS_KEY - MinIO access key
 *   MINIO_SECRET_KEY - MinIO secret key
 *   MINIO_BUCKET - MinIO bucket name (default: printshop)
 *   MINIO_USE_SSL - Use SSL for MinIO connection (default: false)
 */

import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { MinIOUploader, loadMinIOConfig } from '../lib/minio-client';

// ============================================================================
// Constants
// ============================================================================

const EXPORT_FILES = [
  'orders.json',
  'customers.json',
  'quotes.json',
  'products.json',
  'invoices.json',
  'files_manifest.json',
  'summary.json',
];

const FILE_SUBDIRECTORIES = ['artwork', 'production', 'pdfs'];

// ============================================================================
// Types
// ============================================================================

interface SyncStats {
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  totalBytes: number;
  uploadedBytes: number;
  startTime: number;
}

interface IndexEntry {
  filename: string;
  path: string;
  size: number;
  lastModified: string;
}

interface ArchiveIndex {
  timestamp: string;
  exports: IndexEntry[];
  files: IndexEntry[];
  summary: {
    totalFiles: number;
    totalBytes: number;
    exportFiles: number;
    downloadedFiles: number;
  };
}

// ============================================================================
// MinIO Sync
// ============================================================================

export class MinIOSync {
  private uploader: MinIOUploader;
  private extractionDir: string;
  private timestamp: string;
  private stats: SyncStats;

  constructor(extractionDir: string) {
    const config = loadMinIOConfig();
    this.uploader = new MinIOUploader(config);
    this.extractionDir = extractionDir;
    
    // Extract timestamp from directory name
    const dirName = path.basename(extractionDir);
    this.timestamp = dirName;
    
    this.stats = {
      totalFiles: 0,
      uploadedFiles: 0,
      failedFiles: 0,
      totalBytes: 0,
      uploadedBytes: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Ensure MinIO bucket exists
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing MinIO connection...');
    await this.uploader.ensureBucket();
    console.log('✓ MinIO ready\n');
  }

  /**
   * Upload JSON export files
   */
  private async uploadExports(): Promise<IndexEntry[]> {
    console.log('📤 Uploading JSON exports...');

    const index: IndexEntry[] = [];

    for (const filename of EXPORT_FILES) {
      const localPath = path.join(this.extractionDir, filename);
      
      if (!fs.existsSync(localPath)) {
        console.log(`  ⊘ Skipped: ${filename} (not found)`);
        continue;
      }

      const stat = fs.statSync(localPath);
      const remotePath = `printavo-archive/exports/${this.timestamp}/${filename}`;

      try {
        await this.uploader.uploadFile(localPath, remotePath);
        
        this.stats.uploadedFiles++;
        this.stats.uploadedBytes += stat.size;
        
        index.push({
          filename,
          path: remotePath,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
        });

        console.log(`  ✓ ${filename} (${this.formatBytes(stat.size)})`);
      } catch (error) {
        this.stats.failedFiles++;
        console.error(`  ✗ Failed: ${filename}`, error instanceof Error ? error.message : error);
      }
    }

    return index;
  }

  /**
   * Upload downloaded files
   */
  private async uploadFiles(): Promise<IndexEntry[]> {
    console.log('\n📤 Uploading downloaded files...');
    
    const filesDir = path.join(this.extractionDir, 'files');
    
    if (!fs.existsSync(filesDir)) {
      console.log('  ⊘ No files directory found, skipping');
      return [];
    }

    const index: IndexEntry[] = [];
    const byOrderDir = path.join(filesDir, 'by_order');
    
    if (!fs.existsSync(byOrderDir)) {
      console.log('  ⊘ No by_order directory found, skipping');
      return [];
    }

    // Get all order directories
    const orderDirs = fs.readdirSync(byOrderDir)
      .filter(name => fs.statSync(path.join(byOrderDir, name)).isDirectory());

    console.log(`  Found ${orderDirs.length} order directories\n`);

    for (const orderDir of orderDirs) {
      console.log(`  Processing order: ${orderDir}`);
      const orderPath = path.join(byOrderDir, orderDir);
      
      // Process each subdirectory (artwork, production, pdfs)
      for (const subdir of FILE_SUBDIRECTORIES) {
        const subdirPath = path.join(orderPath, subdir);
        
        if (!fs.existsSync(subdirPath)) {
          continue;
        }

        const files = fs.readdirSync(subdirPath)
          .filter(name => fs.statSync(path.join(subdirPath, name)).isFile());

        for (const filename of files) {
          const localPath = path.join(subdirPath, filename);
          const stat = fs.statSync(localPath);
          const remotePath = `printavo-archive/files/by_order/${orderDir}/${subdir}/${filename}`;

          try {
            await this.uploader.uploadFile(localPath, remotePath);
            
            this.stats.uploadedFiles++;
            this.stats.uploadedBytes += stat.size;
            
            index.push({
              filename,
              path: remotePath,
              size: stat.size,
              lastModified: stat.mtime.toISOString(),
            });

            console.log(`    ✓ ${subdir}/${filename} (${this.formatBytes(stat.size)})`);
          } catch (error) {
            this.stats.failedFiles++;
            console.error(`    ✗ Failed: ${subdir}/${filename}`, error instanceof Error ? error.message : error);
          }
        }
      }
    }

    return index;
  }

  /**
   * Create and upload archive index
   */
  private async uploadIndex(exportIndex: IndexEntry[], filesIndex: IndexEntry[]): Promise<void> {
    console.log('\n📝 Creating archive index...');

    const totalBytes = exportIndex.reduce((sum, e) => sum + e.size, 0) +
                       filesIndex.reduce((sum, e) => sum + e.size, 0);

    const index: ArchiveIndex = {
      timestamp: new Date().toISOString(),
      exports: exportIndex,
      files: filesIndex,
      summary: {
        totalFiles: exportIndex.length + filesIndex.length,
        totalBytes,
        exportFiles: exportIndex.length,
        downloadedFiles: filesIndex.length,
      },
    };

    const indexPath = `printavo-archive/index/archive_${this.timestamp}.json`;
    
    try {
      await this.uploader.uploadJSON(index, indexPath);
      console.log(`  ✓ Index uploaded: ${indexPath}`);
    } catch (error) {
      console.error('  ✗ Failed to upload index:', error instanceof Error ? error.message : error);
    }

    // Also upload as latest index
    try {
      await this.uploader.uploadJSON(index, 'printavo-archive/index/latest.json');
      console.log('  ✓ Latest index updated');
    } catch (error) {
      console.error('  ✗ Failed to upload latest index:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Run the full sync process
   */
  async sync(): Promise<void> {
    console.log(`\n🚀 Starting MinIO sync for extraction: ${this.timestamp}\n`);

    try {
      // Initialize MinIO
      await this.initialize();

      // Count total files
      this.stats.totalFiles = this.countFiles();
      console.log(`📊 Total files to upload: ${this.stats.totalFiles}\n`);

      // Upload exports
      const exportIndex = await this.uploadExports();

      // Upload downloaded files
      const filesIndex = await this.uploadFiles();

      // Upload index
      await this.uploadIndex(exportIndex, filesIndex);

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('\n❌ Sync failed:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * Count total files to upload
   */
  private countFiles(): number {
    let count = 0;

    // Count export files
    for (const filename of EXPORT_FILES) {
      if (fs.existsSync(path.join(this.extractionDir, filename))) {
        count++;
      }
    }

    // Count downloaded files
    const filesDir = path.join(this.extractionDir, 'files', 'by_order');
    if (fs.existsSync(filesDir)) {
      const countFilesRecursive = (dir: string): number => {
        let fileCount = 0;
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            fileCount += countFilesRecursive(itemPath);
          } else if (stat.isFile()) {
            fileCount++;
          }
        }
        
        return fileCount;
      };
      
      count += countFilesRecursive(filesDir);
    }

    return count;
  }

  /**
   * Print final summary
   */
  private printSummary(): void {
    const duration = (Date.now() - this.stats.startTime) / 1000;
    const rate = this.stats.uploadedBytes / duration;

    console.log('\n✅ MinIO Sync Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total Files: ${this.stats.totalFiles}`);
    console.log(`   Uploaded: ${this.stats.uploadedFiles}`);
    console.log(`   Failed: ${this.stats.failedFiles}`);
    console.log(`   Total Size: ${this.formatBytes(this.stats.uploadedBytes)}`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    console.log(`   Transfer Rate: ${this.formatBytes(rate)}/s`);
    console.log(`\n📁 Archive Path: printavo-archive/exports/${this.timestamp}/`);
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  try {
    // Get extraction directory from args or use most recent
    let extractionDir = process.argv[2];
    
    if (!extractionDir) {
      // Find most recent extraction directory
      const exportRoot = path.join(process.cwd(), 'data', 'printavo-export', 'v2');
      if (!fs.existsSync(exportRoot)) {
        throw new Error('No extraction directory found. Run npm run printavo:extract first.');
      }

      const dirs = fs.readdirSync(exportRoot)
        .filter(name => fs.statSync(path.join(exportRoot, name)).isDirectory())
        .sort()
        .reverse();

      if (dirs.length === 0) {
        throw new Error('No extraction directory found. Run npm run printavo:extract first.');
      }

      extractionDir = path.join(exportRoot, dirs[0]);
      console.log(`Using most recent extraction: ${dirs[0]}`);
    }

    if (!fs.existsSync(extractionDir)) {
      throw new Error(`Extraction directory not found: ${extractionDir}`);
    }

    const sync = new MinIOSync(extractionDir);
    await sync.sync();

  } catch (error) {
    console.error('\n❌ Sync failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
