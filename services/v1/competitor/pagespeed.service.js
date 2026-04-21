'use strict';

const axios = require('axios');

module.exports = async (domain) => {
  const startedAt = Date.now();
  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const requestUrl = `${endpoint}?url=https://${domain}&key=${process.env.PAGESPEED_API_KEY}`;

  try {
    const { data } = await axios.get(requestUrl, {
      timeout: 60000
    });

    const lighthouseResult = data?.lighthouseResult || {};
    const categories = lighthouseResult.categories || {};
    const audits = lighthouseResult.audits || {};
    const categoryGroups = lighthouseResult.categoryGroups || {};

    const opportunities = Object.entries(audits)
      .filter(([, audit]) => audit?.details?.type === 'opportunity' || audit?.scoreDisplayMode === 'numeric')
      .sort(([, a], [, b]) => (b?.numericValue || 0) - (a?.numericValue || 0))
      .slice(0, 15)
      .map(([id, audit]) => ({
        id,
        title: audit?.title,
        description: audit?.description,
        score: audit?.score,
        numericValue: audit?.numericValue,
        displayValue: audit?.displayValue,
        details: audit?.details || null,
      }));

    const diagnostics = Object.entries(audits)
      .filter(([, audit]) => audit?.details?.type === 'diagnostic')
      .map(([id, audit]) => ({
        id,
        title: audit?.title,
        score: audit?.score,
        displayValue: audit?.displayValue,
        details: audit?.details || null,
      }));

    const resourceSummary = audits['resource-summary']?.details || null;

    return {
      status: 'completed',
      elapsedMs: Date.now() - startedAt,
      metrics: {
        scores: {
          performance: categories.performance?.score != null ? categories.performance.score * 100 : null,
          accessibility: categories.accessibility?.score != null ? categories.accessibility.score * 100 : null,
          seo: categories.seo?.score != null ? categories.seo.score * 100 : null,
        },
        coreWebVitals: {
          lcp: audits['largest-contentful-paint']?.displayValue || null,
          cls: audits['cumulative-layout-shift']?.displayValue || null,
          fcp: audits['first-contentful-paint']?.displayValue || null,
          tbt: audits['total-blocking-time']?.displayValue || null,
          speedIndex: audits['speed-index']?.displayValue || null,
        },
      },
      processed: {
        opportunities,
        diagnostics,
        resourceSummary,
        categoryGroups,
      },
      raw: {
        lighthouseResult,
        loadingExperience: data?.loadingExperience || null,
        originLoadingExperience: data?.originLoadingExperience || null,
      },
    };
  } catch (e) {
    return {
      status: 'failed',
      elapsedMs: Date.now() - startedAt,
      error: e?.message || 'PageSpeed failed',
      raw: null,
    };
  }
};