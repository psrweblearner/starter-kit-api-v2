'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (domain) => {
  try {
    const { data } = await axios.get(`https://${domain}/sitemap.xml`, {
      timeout: 10000
    });

    const $ = cheerio.load(data, { xmlMode: true });

    return {
      exists: true,
      totalUrls: $('url').length
    };

  } catch (e) {
    return {
      exists: false,
      totalUrls: 0
    };
  }
};