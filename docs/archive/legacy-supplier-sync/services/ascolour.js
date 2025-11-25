require('dotenv').config();
const axios = require('axios');
const logger = require('../utils/logger');

const AS_BASE = 'https://api.ascolour.com/v1/catalog';

async function fetchProducts() {
  try {
    const res = await axios.get(`${AS_BASE}/products`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Subscription-Key': process.env.ASCOLOUR_API_KEY
      }
    });

    console.log('🔍 typeof res.data:', typeof res.data);
    console.log('🧩 keys:', Object.keys(res.data || {}));
    console.log('🧪 Raw response preview:', JSON.stringify(res.data, null, 2).slice(0, 500));

    let items = [];

    // ✅ Correct path for real AS Colour response
    if (Array.isArray(res.data.data)) {
      items = res.data.data;
    } else if (Array.isArray(res.data.products)) {
      items = res.data.products;
    } else if (Array.isArray(res.data)) {
      items = res.data;
    } else {
      logger.warn('AS Colour: Unexpected response structure:', res.data);
    }

    logger.info(`AS Colour: Fetched ${items.length} products`);
    return items;
  } catch (err) {
    logger.error(`AS Colour Error: ${err.message}`);
    if (err.response) {
      logger.error(`Status: ${err.response.status}`);
      logger.error(`Body: ${JSON.stringify(err.response.data)}`);
    }
    return [];
  }
}

module.exports = { fetchProducts };