'use strict';

const scrape = require('../../competitor/scrape.service');

module.exports = async function trackingStackModule({ domain }) {
  const scrapeData = await scrape(domain);
  const detection = scrapeData?.trackingDetection || {};
  const tools = [
    tool('Meta Pixel', !!detection.facebookPixel),
    tool('Google Tag Manager', !!detection.googleTagManager),
    tool('Google Analytics', !!detection.googleAnalytics),
    tool('Hotjar', !!detection.hotjar),
    tool('Microsoft Clarity', !!detection.microsoftClarity),
    tool('LinkedIn Insight Tag', !!detection.linkedInInsightTag),
  ];

  const detectedCount = tools.filter((item) => item.status === 'Detected').length;
  const score = Math.min(100, 40 + detectedCount * 10);

  return {
    status: scrapeData?.status === 'completed' ? 'completed' : 'partial',
    score,
    tools,
    issues: tools
      .filter((item) => item.status === 'Not Detected')
      .slice(0, 3)
      .map((item) => ({
        severity: 'warning',
        title: `${item.name} not detected`,
      })),
    error: scrapeData?.error || null,
  };
};

function tool(name, detected) {
  return {
    name,
    status: detected ? 'Detected' : 'Not Detected',
  };
}
