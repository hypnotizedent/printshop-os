const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const pLimit = require('p-limit').default; // ✅ only this one

const INPUT_PATH = 'public/catalog/as-colour.clean.json';
const OUTPUT_PATH = 'public/catalog/as-colour.with-images.json';

const limit = pLimit(5); // ✅ initialize concurrency limiter

async function fetchImageFromURL(url) {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // First try Open Graph meta
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) return [ogImage];

    // Fallback to product gallery
    const galleryImg = $('img').first().attr('src');
    return galleryImg ? [galleryImg] : [];
  } catch (err) {
    console.warn(`⚠️ Failed to fetch from ${url}: ${err.message}`);
    return [];
  }
}

async function run() {
  const file = await fs.readFile(INPUT_PATH, 'utf8');
  const products = JSON.parse(file);

  const updated = await Promise.all(
    products.map(product =>
      limit(async () => {
        if (!product.websiteURL) return product;
        const images = await fetchImageFromURL(product.websiteURL);
        return { ...product, imageUrls: images };
      })
    )
  );

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(updated, null, 2));
  console.log(`✅ Scraped images and saved to ${OUTPUT_PATH}`);
}

run().catch(console.error);