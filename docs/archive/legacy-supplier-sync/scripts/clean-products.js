// scripts/clean-products.js
const fs = require('fs/promises');
const path = require('path');

const catalogs = ['as-colour', 's-and-s'];
const catalogDir = path.join(__dirname, '../public/catalog');

function stripHtml(input) {
  return input?.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() || '';
}

async function cleanCatalog(name) {
  const filePath = path.join(catalogDir, `${name}.json`);
  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

  const cleaned = data.map((p) => ({
    styleId: String(p.styleId || p.style_id || '').trim(),
    name: p.name?.trim() || '',
    brand: p.brand || '',
    category: p.category || '',
    material: (p.material || '').replace(/\s+/g, ' ').trim(),
    description: stripHtml(p.description),
    imageUrls: (p.imageUrls || p.image_urls || []).filter(Boolean),
    sizes: (p.sizes || []).filter(Boolean),
    tags: Array.from(new Set((p.tags || []).map(t => t?.trim()).filter(Boolean))),
    colors: (p.colors || []).map(c => ({
      name: c.name?.trim() || '',
      hex: c.hex || null,
    })).filter(c => c.name),
    supplier: p.supplier || '', // optional for frontend use
  }));

  const outputFile = path.join(catalogDir, `${name}.clean.json`);
  await fs.writeFile(outputFile, JSON.stringify(cleaned, null, 2), 'utf8');
  console.log(`🧼 Cleaned ${cleaned.length} products → ${name}.clean.json`);
}

async function run() {
  for (const name of catalogs) {
    await cleanCatalog(name);
  }
}

run().catch(console.error);