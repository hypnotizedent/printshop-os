const fs = require('fs');
const path = require('path');
const { fetchStyles } = require('./services/ss');
const { fetchProducts: fetchAS } = require('./services/ascolour');
const { normalizeSS, normalizeAS } = require('./utils/normalize');
const { syncProducts } = require('./utils/syncProducts');

async function main() {
  const rawSS = await fetchStyles();
  const ssNormalized = rawSS.map(normalizeSS);

  const rawAS = await fetchAS();
  console.log('🟨 AS Colour raw response:', rawAS);

  const asData = Array.isArray(rawAS) ? rawAS : rawAS?.items || [];
  const asNormalized = asData.map(normalizeAS);

  const all = [...ssNormalized, ...asNormalized];

 const outputPath = path.join(__dirname, 'data', 'output.json');
fs.writeFileSync(outputPath, JSON.stringify(all, null, 2));
console.log('🧪 Sample record:', all[0]);
console.log('🧪 First raw S&S record:', rawSS[0]);
console.log(`✅ Saved ${all.length} total products to output.json`);

const valid = all.filter(p => p.style_id && p.name);
const invalid = all.filter(p => !p.style_id || !p.name);
console.log(`🔍 ${valid.length} valid products after filter`);
console.log(`⚠️ Skipped ${invalid.length} products missing style_id or name`);

await syncProducts(valid);
}

main();