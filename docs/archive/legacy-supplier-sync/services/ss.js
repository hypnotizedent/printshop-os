require('dotenv').config();
const axios = require('axios');
const logger = require('../utils/logger');

const SS_BASE = 'https://api.ssactivewear.com/v2';

async function fetchStyles() {
  try {
    const auth = {
      username: process.env.SS_USERNAME,
      password: process.env.SS_PASSWORD
    };

    const res = await axios.get(`${SS_BASE}/styles`, { auth });
    logger.info(`S&S: Fetched ${res.data.length} styles`);
    return res.data;
  } catch (err) {
    logger.error(`S&S Error: ${err.message}`);
    if (err.response) {
      logger.error(`Status: ${err.response.status}`);
      logger.error(`Body: ${JSON.stringify(err.response.data)}`);
    }
    return [];
  }
}

module.exports = { fetchStyles };