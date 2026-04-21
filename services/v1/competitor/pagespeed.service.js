'use strict';

const axios = require('axios');

module.exports = async (domain) => {
  try {
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${domain}&key=${process.env.PAGESPEED_API_KEY}`;

    const { data } = await axios.get(url, {
      timeout: 10000
    });

    return {
      performance: data.lighthouseResult.categories.performance.score * 100,
      lcp: data.lighthouseResult.audits['largest-contentful-paint'].displayValue,
      cls: data.lighthouseResult.audits['cumulative-layout-shift'].displayValue
    };
  } catch (e) {
    return { error: 'PageSpeed failed' };
  }
};