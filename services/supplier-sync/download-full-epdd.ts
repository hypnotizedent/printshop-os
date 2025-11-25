#!/usr/bin/env ts-node

import { SanMarSFTPClient } from './src/clients/sanmar-sftp.client';
import { existsSync, statSync } from 'fs';

async function main() {
  const client = new SanMarSFTPClient({
    host: process.env.SANMAR_SFTP_HOST || 'ftp.sanmar.com',
    port: parseInt(process.env.SANMAR_SFTP_PORT || '2200'),
    username: process.env.SANMAR_SFTP_USERNAME!,
    password: process.env.SANMAR_SFTP_PASSWORD!,
    remoteDirectory: '/SanMarPDD',
    localDirectory: '/tmp',
  });

  console.log('Connecting to SanMar SFTP...');
  await client.connect();
  
  console.log('Listing files...');
  const files = await client.listFiles();
  
  console.log(`\nAvailable files (${files.length}):`);
  files.forEach(f => {
    console.log(`  - ${f.filename} (${(f.size / 1024 / 1024).toFixed(1)} MB) [${f.type}]`);
  });
  
  const epdd = files.find(f => f.type === 'EPDD');
  
  if (epdd) {
    console.log(`\n📥 Downloading: ${epdd.filename} (${(epdd.size / 1024 / 1024).toFixed(1)} MB)`);
    console.log('⏳ This may take 2-5 minutes...\n');
    const start = Date.now();
    const localPath = await client.downloadFile(epdd.filename);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    
    if (existsSync(localPath)) {
      const stats = statSync(localPath);
      console.log(`\n✅ Downloaded successfully!`);
      console.log(`   Path: ${localPath}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
      console.log(`   Time: ${elapsed}s`);
      console.log(`   Speed: ${(stats.size / 1024 / 1024 / parseFloat(elapsed)).toFixed(2)} MB/s`);
    }
  } else {
    console.log('\n❌ EPDD file not found');
  }
  
  await client.disconnect();
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
