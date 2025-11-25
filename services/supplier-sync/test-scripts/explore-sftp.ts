#!/usr/bin/env ts-node

/**
 * Quick SFTP exploration script
 */

import 'dotenv/config';
import Client from 'ssh2-sftp-client';

async function explore() {
  const client = new Client();
  
  try {
    await client.connect({
      host: process.env.SANMAR_SFTP_HOST || 'ftp.sanmar.com',
      port: parseInt(process.env.SANMAR_SFTP_PORT || '2200'),
      username: process.env.SANMAR_SFTP_USERNAME!,
      password: process.env.SANMAR_SFTP_PASSWORD!,
    });

    console.log('Connected successfully!');
    console.log('\n=== Root Directory (/) ===');
    const rootList = await client.list('/');
    rootList.forEach((item: any) => {
      console.log(`${item.type === 'd' ? '[DIR]' : '[FILE]'} ${item.name} (${item.size} bytes)`);
    });

    // Try common directory names
    const tryDirs = ['SanmarPDD', 'SanMar', 'products', 'data', 'exports'];
    for (const dir of tryDirs) {
      try {
        console.log(`\n=== Trying /${dir} ===`);
        const dirList = await client.list(`/${dir}`);
        console.log(`SUCCESS! Found ${dirList.length} items:`);
        dirList.slice(0, 5).forEach((item: any) => {
          console.log(`  ${item.type === 'd' ? '[DIR]' : '[FILE]'} ${item.name}`);
        });
      } catch (error: any) {
        console.log(`  Not found or no access`);
      }
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

explore();
