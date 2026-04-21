'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (domain) => {
  try {
    const { data } = await axios.get(`https://${domain}`, {
      timeout: 10000
    });

    const $ = cheerio.load(data);

    return {
      title: $('title').text(),
      metaDescription: $('meta[name="description"]').attr('content'),
      h1Count: $('h1').length,
      imgCount: $('img').length,

      seo: {
        hasViewport: !!$('meta[name="viewport"]').length,
        canonical: $('link[rel="canonical"]').attr('href')
      },

      tracking: {
        gtm: data.includes('googletagmanager'),
        fbPixel: data.includes('facebook'),
        ga: data.includes('gtag')
      }
    };

  } catch (e) {
    return { error: 'Scrape failed' };
  }
};