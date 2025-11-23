const fs = require('fs/promises');
const path = require('path');

async function optimizeCatalog(filename) {
  const inputPath = path.join('public', 'catalog', filename + '.json');
  const outputPath = path.join('public', 'catalog', filename + '.clean.json');

  const data = JSON.parse(await fs.readFile(inputPath, 'utf8'));

  const cleaned = data.map((p) => ({
    styleId: p.styleId || p.style_id || null,
    name: p.name,
    brand: p.brand,
    category: p.category,
    image: p.imageUrls?.[0] || p.image_urls?.[0] || null,
    material: p.material || '',
    description: p.description || '',
    tags: (p.tags || []).filter(Boolean),
  }));

  await fs.writeFile(outputPath, JSON.stringify(cleaned, null, 2));
  console.log(`🧼 Cleaned ${filename}.json -> ${filename}.clean.json`);
}

async function run() {
  await optimizeCatalog('as-colour');
  await optimizeCatalog('unknown');
}

run().catch(console.error);