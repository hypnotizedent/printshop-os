// services/sanmar.js
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LOCAL_DIR = path.join(__dirname, '..', 'tmp', 'sanmar');
const FTP_FILES = [
  'sanmar_activeproductsexport.txt',
  'catalog.txt',
  'sanmar_pdd.txt',
  'media.txt'
];

async function fetchSanMarFiles() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: process.env.SANMAR_FTP_HOST,
      user: process.env.SANMAR_FTP_USER,
      password: process.env.SANMAR_FTP_PASS,
      port: 2200,
      secure: false,
    });

    if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });

    for (const fileName of FTP_FILES) {
      const destPath = path.join(LOCAL_DIR, fileName);
      console.log(`⬇️ Downloading ${fileName}...`);
      await client.downloadTo(destPath, fileName);
    }

    console.log('✅ SanMar files downloaded.');
  } catch (err) {
    console.error('❌ FTP Error:', err.message);
  }

  client.close();
}

module.exports = { fetchSanMarFiles };