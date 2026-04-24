'use strict';

const scrape = require('../../competitor/scrape.service');

module.exports = async function contentQualityModule({ domain }) {
  const scrapeData = await scrape(domain);
  const extracted = scrapeData?.extracted || {};
  const titleText = String(extracted.title || '');
  const descriptionText = String(extracted.metaDescription || '');
  const fullText = `${titleText} ${descriptionText}`.trim();
  const words = fullText.toLowerCase().split(/\s+/).filter(Boolean);
  const keywordDensity = calculateKeywordDensity(words);
  const contentLength = words.length;
  const missingAlt = Number(extracted?.images?.missingAlt || 0);
  const internalLinksCount = Array.isArray(extracted?.links?.internal) ? extracted.links.internal.length : 0;

  const issues = [];
  if (contentLength < 40) issues.push({ severity: 'warning', title: 'Low content length on analyzed page' });
  if (missingAlt > 0) issues.push({ severity: missingAlt > 10 ? 'critical' : 'warning', title: `${missingAlt} images missing alt tags` });
  if (internalLinksCount < 3) issues.push({ severity: 'warning', title: 'Low internal links count' });
  const errors = [];
  if (missingAlt > 0) {
    errors.push({
      code: 'MISSING_ALT_IMAGES',
      message: `${missingAlt} images are missing alt attributes.`,
      severity: missingAlt > 10 ? 'critical' : 'warning',
    });
  }

  return {
    status: scrapeData?.status === 'completed' ? 'completed' : 'partial',
    score: Math.max(0, 100 - issues.length * 15),
    keywordDensity,
    contentLength,
    missingAltTags: missingAlt,
    internalLinksCount,
    issues,
    errors,
    error: scrapeData?.error || null,
  };
};

function calculateKeywordDensity(words) {
  if (!words.length) return [];
  const map = new Map();
  words.forEach((word) => {
    if (word.length < 4) return;
    map.set(word, (map.get(word) || 0) + 1);
  });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword, count]) => ({
      keyword,
      count,
      density: Number(((count / words.length) * 100).toFixed(2)),
    }));
}
