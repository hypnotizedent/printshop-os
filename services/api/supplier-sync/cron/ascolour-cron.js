require('dotenv').config();
const cron = require('node-cron');
const { exec } = require('child_process');

// Run daily at 3:00 AM
cron.schedule('0 3 * * *', () => {
  console.log('🔁 Running AS Colour sync...');
  exec('node scripts/seed-ascolour-products.js', (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ Cron failed: ${err.message}`);
    } else {
      console.log(`✅ Cron finished:\n${stdout}`);
    }
  });
});