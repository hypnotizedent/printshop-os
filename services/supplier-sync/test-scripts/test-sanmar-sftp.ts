#!/usr/bin/env ts-node

/**
 * SanMar SFTP Test Script
 * 
 * Tests the SFTP connection and downloads sample files.
 * Run: npx ts-node test-scripts/test-sanmar-sftp.ts
 */

import 'dotenv/config';
import { SanMarSFTPClient } from '../src/clients/sanmar-sftp.client';
import { SanMarCSVTransformer } from '../src/transformers/sanmar-csv.transformer';
import { logger } from '../src/utils/logger';

async function testSanMarSFTP() {
  console.log('='.repeat(60));
  console.log('SanMar SFTP Integration Test');
  console.log('='.repeat(60));

  // Initialize SFTP client
  const client = new SanMarSFTPClient({
    host: process.env.SANMAR_SFTP_HOST || 'ftp.sanmar.com',
    port: parseInt(process.env.SANMAR_SFTP_PORT || '2200'),
    username: process.env.SANMAR_SFTP_USERNAME!,
    password: process.env.SANMAR_SFTP_PASSWORD!,
    remoteDirectory: process.env.SANMAR_SFTP_DIRECTORY || '/SanmarPDD',
    localDirectory: '/tmp/sanmar-test-data',
  });

  try {
    // Test 1: Health Check
    console.log('\n[Test 1] Running health check...');
    const health = await client.healthCheck();
    console.log('Health check result:', JSON.stringify(health, null, 2));

    if (!health.connected) {
      throw new Error('Failed to connect to SFTP server');
    }

    // Test 2: Connect and List Files
    console.log('\n[Test 2] Connecting to SFTP server...');
    await client.connect();
    
    console.log('\n[Test 3] Listing available files...');
    const files = await client.listFiles();
    
    console.log(`\nFound ${files.length} files on SFTP server:\n`);
    console.log('┌────────────────────────────┬────────┬──────────────┬────────────┐');
    console.log('│ Filename                   │ Type   │ Size (MB)    │ Modified   │');
    console.log('├────────────────────────────┼────────┼──────────────┼────────────┤');
    
    files.forEach(file => {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const modified = file.lastModified.toISOString().split('T')[0];
      console.log(
        `│ ${file.filename.padEnd(26)} │ ${file.type.padEnd(6)} │ ${sizeMB.padStart(10)} MB │ ${modified} │`
      );
    });
    console.log('└────────────────────────────┴────────┴──────────────┴────────────┘');

    // Test 4: Download EPDD File
    const epddFile = files.find(f => f.type === 'EPDD');
    if (epddFile) {
      console.log(`\n[Test 4] Downloading EPDD file: ${epddFile.filename}...`);
      const epddPath = await client.downloadFile(epddFile.filename);
      console.log('Downloaded to:', epddPath);

      // Parse first 10 records
      console.log('\n[Test 5] Parsing CSV file (first 10 records)...');
      const epddRecords = await client.parseCSVFile(epddPath);
      console.log(`Total records: ${epddRecords.length}`);
      console.log('\nSample records:');
      console.log(JSON.stringify(epddRecords.slice(0, 3), null, 2));

      // Test 6: Transform to UnifiedProduct
      console.log('\n[Test 6] Transforming EPDD records...');
      const transformer = new SanMarCSVTransformer();
      const products = transformer.transformEPDDRecords(epddRecords);
      
      console.log(`Transformed ${products.length} products`);
      console.log('\nSample product:');
      console.log(JSON.stringify(products[0], null, 2));

      // Test 7: Calculate Statistics
      console.log('\n[Test 7] Calculating statistics...');
      const stats = transformer.calculateStats(products);
      console.log('Statistics:', JSON.stringify(stats, null, 2));
    }

    // Test 8: Download DIP File (Inventory)
    const dipFile = files.find(f => f.type === 'DIP');
    if (dipFile) {
      console.log(`\n[Test 8] Downloading DIP inventory file: ${dipFile.filename}...`);
      const dipPath = await client.downloadFile(dipFile.filename);
      console.log('Downloaded to:', dipPath);

      // Parse inventory records
      console.log('\n[Test 9] Parsing DIP inventory file...');
      const dipRecords = await client.parseCSVFile(dipPath);
      console.log(`Total inventory records: ${dipRecords.length}`);
      console.log('\nSample inventory records:');
      console.log(JSON.stringify(dipRecords.slice(0, 3), null, 2));
    }

    // Disconnect
    await client.disconnect();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test failed:', error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run tests
testSanMarSFTP().catch(console.error);
