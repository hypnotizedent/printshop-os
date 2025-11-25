// scripts/test-sanmar-ftp.js
require('dotenv').config();
const ftp = require('basic-ftp');

async function fetchSanMarFiles() {
  const client = new ftp.Client();
  client.ftp.verbose = true; // shows detailed output

  try {
    await client.access({
      host: "ftp.sanmar.com",
      user: process.env.SANMAR_USERNAME,
      password: process.env.SANMAR_PASSWORD,
      secure: false,
    });

    console.log("✅ Connected successfully");

    const list = await client.list();
    console.log("📂 Directory contents:", list.map(item => item.name));

    await client.close();
  } catch (err) {
    console.error("❌ FTP Error:", err.message || err);
  }
}

fetchSanMarFiles();