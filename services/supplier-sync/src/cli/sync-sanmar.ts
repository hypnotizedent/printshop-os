#!/usr/bin/env ts-node

import { SanMarSFTPClient } from '../clients/sanmar-sftp.client';
import { SanMarCSVTransformer } from '../transformers/sanmar-csv.transformer';
import { persistProducts } from '../persistence/productPersistence';
import { logger } from '../utils/logger';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';

interface SyncOptions {
  dryRun: boolean;
  limit?: number;
  fileType: 'EPDD' | 'SDL_N' | 'DIP';
  download: boolean;
  localFile?: string;
}

async function parseArgs(): Promise<SyncOptions> {
  const args = process.argv.slice(2);
  
  const options: SyncOptions = {
    dryRun: args.includes('--dry-run'),
    limit: undefined,
    fileType: 'EPDD',
    download: !args.includes('--no-download'),
    localFile: undefined,
  };

  // Parse --limit=N
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  if (limitArg) {
    options.limit = parseInt(limitArg.split('=')[1]);
  }

  // Parse --file-type=TYPE
  const fileTypeArg = args.find(arg => arg.startsWith('--file-type='));
  if (fileTypeArg) {
    const type = fileTypeArg.split('=')[1].toUpperCase();
    if (type === 'EPDD' || type === 'SDL_N' || type === 'DIP') {
      options.fileType = type;
    }
  }

  // Parse --local-file=PATH
  const localFileArg = args.find(arg => arg.startsWith('--local-file='));
  if (localFileArg) {
    options.localFile = localFileArg.split('=')[1];
    options.download = false;
  }

  return options;
}

async function downloadFile(client: SanMarSFTPClient, fileType: string): Promise<string> {
  logger.info(`Downloading ${fileType} file from SanMar SFTP...`);
  
  await client.connect();
  const files = await client.listFiles();
  
  // Find the most recent file of the requested type
  const targetFile = files.find(f => f.type === fileType);
  
  if (!targetFile) {
    throw new Error(`No ${fileType} file found on SFTP server`);
  }

  logger.info(`Found file: ${targetFile.filename} (${(targetFile.size / 1024 / 1024).toFixed(1)} MB)`);
  
  const localPath = await client.downloadFile(targetFile.filename);
  await client.disconnect();
  
  return localPath;
}

async function parseCSV(filePath: string, limit?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    let count = 0;
    let errorCount = 0;

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Handle inconsistent column counts
      relax_quotes: true, // Handle unescaped quotes in descriptions
      escape: '"',
      quote: '"',
      on_record: (record: any, { lines }: any) => {
        // Skip records with obvious malformation
        if (!record.UNIQUE_KEY || !record['STYLE#']) {
          errorCount++;
          return null; // Skip this record
        }
        return record;
      }
    });

    createReadStream(filePath)
      .pipe(parser)
      .on('data', (record) => {
        if (record && (!limit || count < limit)) {
          records.push(record);
          count++;
        }
      })
      .on('end', () => {
        logger.info(`Parsed ${records.length} records from CSV (${errorCount} skipped)`);
        resolve(records);
      })
      .on('error', (error) => {
        logger.warn(`CSV parsing error, returning ${records.length} records collected so far`, { error: error.message });
        resolve(records); // Return what we have instead of failing
      });
  });
}

async function main() {
  try {
    const options = await parseArgs();

    logger.info('SanMar Sync Started', { options });

    // Configuration from environment
    const config = {
      host: process.env.SANMAR_SFTP_HOST || 'ftp.sanmar.com',
      port: parseInt(process.env.SANMAR_SFTP_PORT || '2200'),
      username: process.env.SANMAR_SFTP_USERNAME!,
      password: process.env.SANMAR_SFTP_PASSWORD!,
      remoteDirectory: process.env.SANMAR_SFTP_REMOTE_DIR || '/SanMarPDD',
    };

    if (!config.username || !config.password) {
      throw new Error('SANMAR_SFTP_USERNAME and SANMAR_SFTP_PASSWORD must be set');
    }

    // Download or use local file
    let filePath: string;
    if (options.localFile) {
      filePath = options.localFile;
      logger.info(`Using local file: ${filePath}`);
    } else if (options.download) {
      const client = new SanMarSFTPClient(config);
      filePath = await downloadFile(client, options.fileType);
    } else {
      // Use existing temp file
      const filename = options.fileType === 'EPDD' ? 'SanMar_EPDD.csv' : 
                      options.fileType === 'SDL_N' ? 'SanMar_SDL_N.csv' : 
                      'sanmar_dip.txt';
      filePath = `/tmp/${filename}`;
      logger.info(`Using existing temp file: ${filePath}`);
    }

    // Parse CSV
    logger.info('Parsing CSV file...');
    const records = await parseCSV(filePath, options.limit);

    if (records.length === 0) {
      logger.warn('No records found in CSV file');
      return;
    }

    // Log sample record for verification
    logger.info('Sample record:', { record: records[0] });

    // Transform based on file type
    const transformer = new SanMarCSVTransformer();
    let products;

    switch (options.fileType) {
      case 'EPDD':
        products = transformer.transformEPDDRecords(records);
        break;
      case 'SDL_N':
        products = transformer.transformSDLRecords(records);
        break;
      case 'DIP':
        logger.info('DIP inventory updates - merge logic required');
        // DIP files are inventory updates, not full products
        // Would need existing products to merge with
        return;
      default:
        throw new Error(`Unsupported file type: ${options.fileType}`);
    }

    logger.info(`Transformed ${products.length} products`);

    // Log sample product
    if (products.length > 0) {
      logger.info('Sample product:', {
        sku: products[0].sku,
        name: products[0].name,
        brand: products[0].brand,
        variants: products[0].variants?.length || 0,
      });
    }

    // Persist or dry-run
    if (options.dryRun) {
      logger.info('DRY RUN - No data persisted');
      logger.info(`Would persist ${products.length} products`);
      
      // Show first 3 products
      products.slice(0, 3).forEach((p, i) => {
        logger.info(`Product ${i + 1}:`, {
          sku: p.sku,
          name: p.name,
          brand: p.brand,
          category: p.category,
          variantCount: p.variants?.length || 0,
        });
      });
    } else {
      logger.info('Persisting products...');
      persistProducts(products);
      logger.info(`✅ Persisted ${products.length} SanMar products`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SanMar Sync Complete');
    console.log('='.repeat(60));
    console.log(`File Type:    ${options.fileType}`);
    console.log(`Records:      ${records.length}`);
    console.log(`Products:     ${products.length}`);
    console.log(`Mode:         ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    logger.error('SanMar sync failed', { error });
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  logger.info('Sync interrupted by user');
  process.exit(0);
});

main();
