require('dotenv').config();

const { fetchProducts } = require('./services/ascolour');  // ✅ correct path
const { normalizeAS } = require('./utils/normalize');            // ✅ correct path

async function testASNormalizer() {
  const products = await fetchProducts();

  if (products.length > 0) {
    const sample = products[0];
    console.log('🟡 Raw AS Colour Sample:', JSON.stringify(sample, null, 2));

    const normalized = normalizeAS(sample);
    console.log('🟢 Normalized Output:', JSON.stringify(normalized, null, 2));
  } else {
    console.log('❌ No products found.');
  }
}

testASNormalizer();