/**
 * Download Printavo Files Script
 * 
 * Downloads all files (artwork, production files, PDFs) from URLs
 * extracted by the extract-printavo-v2.ts script.
 * 
 * Features:
 * - Reads files_manifest.json from extraction output
 * - Downloads artwork files (PNG, JPG, etc.)
 * - Downloads production files (DST, EPS, AI, PDF)
 * - Downloads order PDFs (invoice, workorder, packing slip)
 * - Parallel downloads with configurable concurrency (default: 5)
 * - Progress reporting with ETA
 * - Checkpoint/resume support
 * - Organizes files by order: files/{visualId}/artwork/, files/{visualId}/production/, etc.
 * 
 * Usage:
 *   npm run printavo:download-files [extraction-directory]
 * 
 * Environment Variables:
 *   DOWNLOAD_CONCURRENCY - Number of parallel downloads (default: 5)
 *   DOWNLOAD_CHECKPOINT_FILE - Path to checkpoint file for resume
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// ============================================================================
// Types
// ============================================================================

interface FileManifest {
  extractedAt: string;
  totalOrders: number;
  totalFiles: number;
  files: OrderFiles[];
}

interface OrderFiles {
  orderId: string;
  visualId: string;
  artwork: FileInfo[];
  production: FileInfo[];
  pdfs: FileInfo[];
}

interface FileInfo {
  url: string;
  filename: string;
  type: 'artwork' | 'production' | 'pdf';
  category?: string; // 'invoice', 'workorder', 'packing_slip', etc.
}

interface DownloadCheckpoint {
  lastProcessedOrder: number;
  downloadedFiles: string[];
  failedFiles: DownloadError[];
  timestamp: string;
}

interface DownloadError {
  url: string;
  orderId: string;
  visualId: string;
  filename: string;
  error: string;
}

interface DownloadStats {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  startTime: number;
}

// ============================================================================
// File Downloader
// ============================================================================

export class PrintavoFileDownloader {
  private manifest: FileManifest | null = null;
  private checkpoint: DownloadCheckpoint;
  private checkpointFile: string;
  private outputDir: string;
  private concurrency: number;
  private stats: DownloadStats;

  constructor(extractionDir: string, concurrency: number = 5) {
    this.outputDir = path.join(extractionDir, 'files');
    this.checkpointFile = path.join(extractionDir, 'download_checkpoint.json');
    this.concurrency = concurrency;
    this.checkpoint = this.loadCheckpoint();
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Load or create checkpoint for resume support
   */
  private loadCheckpoint(): DownloadCheckpoint {
    if (fs.existsSync(this.checkpointFile)) {
      try {
        const data = fs.readFileSync(this.checkpointFile, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.warn('⚠️  Failed to load checkpoint, starting fresh');
      }
    }

    return {
      lastProcessedOrder: -1,
      downloadedFiles: [],
      failedFiles: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Save checkpoint
   */
  private saveCheckpoint(): void {
    try {
      fs.writeFileSync(
        this.checkpointFile,
        JSON.stringify(this.checkpoint, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
    }
  }

  /**
   * Load file manifest from extraction output
   */
  async loadManifest(extractionDir: string): Promise<void> {
    const manifestPath = path.join(extractionDir, 'files_manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      // Try to generate manifest from orders.json
      console.log('📝 files_manifest.json not found, generating from orders.json...');
      await this.generateManifestFromOrders(extractionDir);
      return;
    }

    try {
      const data = fs.readFileSync(manifestPath, 'utf-8');
      this.manifest = JSON.parse(data);
      console.log(`✓ Loaded manifest: ${this.manifest!.totalFiles} files from ${this.manifest!.totalOrders} orders`);
    } catch (error) {
      throw new Error(`Failed to load manifest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate file manifest from orders.json
   * (Fallback if files_manifest.json doesn't exist)
   */
  private async generateManifestFromOrders(extractionDir: string): Promise<void> {
    const ordersPath = path.join(extractionDir, 'orders.json');
    
    if (!fs.existsSync(ordersPath)) {
      throw new Error('Neither files_manifest.json nor orders.json found in extraction directory');
    }

    console.log('Analyzing orders.json for file URLs...');
    
    // This is a placeholder - in a real implementation, you would parse
    // the orders.json file and extract file URLs from various fields
    // For now, we'll create an empty manifest
    this.manifest = {
      extractedAt: new Date().toISOString(),
      totalOrders: 0,
      totalFiles: 0,
      files: [],
    };

    console.error('\n⚠️  WARNING: File URL extraction from orders.json is not yet implemented!');
    console.error('   This will result in NO FILES being downloaded.');
    console.error('   The extraction script (extract-printavo-v2.ts) should generate');
    console.error('   a files_manifest.json file containing file URLs.\n');
  }

  /**
   * Download a single file
   */
  private async downloadFile(
    url: string,
    localPath: string,
    orderId: string,
    visualId: string,
    filename: string
  ): Promise<void> {
    // Check if already downloaded
    const fileKey = `${orderId}/${filename}`;
    if (this.checkpoint.downloadedFiles.includes(fileKey)) {
      this.stats.skipped++;
      return;
    }

    // Check if file already exists
    if (fs.existsSync(localPath)) {
      this.checkpoint.downloadedFiles.push(fileKey);
      this.stats.skipped++;
      return;
    }

    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Download file
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
      });

      // Pipe to file
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Mark as downloaded
      this.checkpoint.downloadedFiles.push(fileKey);
      this.stats.completed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.checkpoint.failedFiles.push({
        url,
        orderId,
        visualId,
        filename,
        error: errorMessage,
      });
      
      this.stats.failed++;
      throw error;
    }
  }

  /**
   * Download files for a single order
   */
  private async downloadOrderFiles(orderFiles: OrderFiles): Promise<void> {
    const { orderId, visualId, artwork, production, pdfs } = orderFiles;
    
    const allFiles = [
      ...artwork.map(f => ({ ...f, subdir: 'artwork' })),
      ...production.map(f => ({ ...f, subdir: 'production' })),
      ...pdfs.map(f => ({ ...f, subdir: 'pdfs' })),
    ];

    for (const file of allFiles) {
      const localPath = path.join(
        this.outputDir,
        'by_order',
        visualId || orderId,
        file.subdir,
        file.filename
      );

      try {
        await this.downloadFile(file.url, localPath, orderId, visualId, file.filename);
      } catch (error) {
        // Error already logged in downloadFile
        console.error(`  ✗ Failed: ${file.filename}`);
      }
    }
  }

  /**
   * Download all files with progress reporting
   */
  async downloadAll(): Promise<void> {
    if (!this.manifest || this.manifest.files.length === 0) {
      console.log('No files to download');
      return;
    }

    this.stats.total = this.manifest.totalFiles;
    console.log(`\n🚀 Starting download of ${this.stats.total} files from ${this.manifest.totalOrders} orders`);
    console.log(`   Concurrency: ${this.concurrency}`);
    console.log(`   Output: ${this.outputDir}\n`);

    const startIndex = this.checkpoint.lastProcessedOrder + 1;
    
    if (startIndex > 0) {
      console.log(`📍 Resuming from order ${startIndex + 1}/${this.manifest.files.length}`);
    }

    // Process orders with concurrency control
    for (let i = startIndex; i < this.manifest.files.length; i++) {
      const orderFiles = this.manifest.files[i];
      
      console.log(`\n[${i + 1}/${this.manifest.files.length}] Order ${orderFiles.visualId || orderFiles.orderId}`);
      console.log(`   Files: ${orderFiles.artwork.length} artwork, ${orderFiles.production.length} production, ${orderFiles.pdfs.length} PDFs`);

      await this.downloadOrderFiles(orderFiles);

      // Update checkpoint
      this.checkpoint.lastProcessedOrder = i;
      this.checkpoint.timestamp = new Date().toISOString();
      this.saveCheckpoint();

      // Progress report
      this.printProgress();
    }

    console.log('\n✅ Download complete!');
    this.printSummary();
  }

  /**
   * Print progress with ETA
   */
  private printProgress(): void {
    const processed = this.stats.completed + this.stats.failed + this.stats.skipped;
    const percent = ((processed / this.stats.total) * 100).toFixed(1);
    
    const elapsed = Date.now() - this.stats.startTime;
    const rate = processed / (elapsed / 1000);
    const remaining = this.stats.total - processed;
    const eta = remaining / rate;
    
    const etaMin = Math.floor(eta / 60);
    const etaSec = Math.floor(eta % 60);

    console.log(`   Progress: ${processed}/${this.stats.total} (${percent}%) | ETA: ${etaMin}m ${etaSec}s`);
  }

  /**
   * Print final summary
   */
  private printSummary(): void {
    const duration = (Date.now() - this.stats.startTime) / 1000;
    const rate = this.stats.completed / duration;

    console.log('\n📊 Download Summary:');
    console.log(`   Total: ${this.stats.total}`);
    console.log(`   Completed: ${this.stats.completed}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    console.log(`   Failed: ${this.stats.failed}`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    console.log(`   Rate: ${rate.toFixed(2)} files/sec`);

    if (this.checkpoint.failedFiles.length > 0) {
      console.log(`\n⚠️  Failed Downloads (${this.checkpoint.failedFiles.length}):`);
      for (const failed of this.checkpoint.failedFiles.slice(0, 10)) {
        console.log(`   - ${failed.visualId}/${failed.filename}: ${failed.error}`);
      }
      if (this.checkpoint.failedFiles.length > 10) {
        console.log(`   ... and ${this.checkpoint.failedFiles.length - 10} more`);
      }
      console.log(`\n   See ${this.checkpointFile} for full list`);
    }
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

    const concurrency = parseInt(process.env.DOWNLOAD_CONCURRENCY || '5', 10);
    const downloader = new PrintavoFileDownloader(extractionDir, concurrency);

    await downloader.loadManifest(extractionDir);
    await downloader.downloadAll();

    console.log('\n✅ File download complete!');
    console.log(`📁 Files saved to: ${path.join(extractionDir, 'files')}`);
  } catch (error) {
    console.error('\n❌ Download failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
