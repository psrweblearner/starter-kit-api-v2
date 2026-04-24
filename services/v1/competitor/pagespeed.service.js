'use strict';

const axios = require('axios');

const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const REQUEST_TIMEOUT_MS = Number(process.env.PAGESPEED_TIMEOUT_MS || 90000);
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error) {
  const status = Number(error?.response?.status || 0);
  if (RETRYABLE_STATUS.has(status)) return true;
  const code = String(error?.code || '').toUpperCase();
  return ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(code);
}

function normalizeApiError(error) {
  const status = Number(error?.response?.status || 0);
  const apiMessage = error?.response?.data?.error?.message;
  const localMessage = error?.message;
  if (apiMessage) return status ? `${apiMessage} (HTTP ${status})` : apiMessage;
  if (localMessage) return localMessage;
  return 'PageSpeed failed';
}

async function requestPageSpeed(url, strategy) {
  const params = {
    url,
    key: process.env.PAGESPEED_API_KEY,
    strategy,
    category: ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'],
  };
  return axios.get(endpoint, {
    timeout: REQUEST_TIMEOUT_MS,
    params,
  });
}

async function requestWithRetry(url, strategy) {
  const maxAttempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestPageSpeed(url, strategy);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error)) throw error;
      await wait(1000 * attempt);
    }
  }
  throw lastError;
}

module.exports = async (domain) => {
  const startedAt = Date.now();
  const primaryUrl = `https://${domain}`;
  const fallbackUrl = `http://${domain}`;

  if (!process.env.PAGESPEED_API_KEY) {
    return {
      status: 'partial',
      elapsedMs: Date.now() - startedAt,
      error: 'PAGESPEED_API_KEY is missing',
      metrics: {
        scores: { performance: null, accessibility: null, seo: null },
        coreWebVitals: { lcp: null, cls: null, fcp: null, tbt: null, speedIndex: null },
      },
      processed: {
        opportunities: [],
        diagnostics: [],
        resourceSummary: null,
        categoryGroups: {},
      },
      raw: null,
    };
  }

  try {
    let data;
    let lastError;
    const candidates = [
      { url: primaryUrl, strategy: 'mobile' },
      { url: primaryUrl, strategy: 'desktop' },
      { url: fallbackUrl, strategy: 'mobile' },
      { url: fallbackUrl, strategy: 'desktop' },
    ];
    for (const candidate of candidates) {
      try {
        const response = await requestWithRetry(candidate.url, candidate.strategy);
        data = response?.data;
        if (data?.lighthouseResult) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!data?.lighthouseResult) {
      return {
        status: 'partial',
        elapsedMs: Date.now() - startedAt,
        error: normalizeApiError(lastError),
        metrics: {
          scores: { performance: null, accessibility: null, seo: null },
          coreWebVitals: { lcp: null, cls: null, fcp: null, tbt: null, speedIndex: null },
        },
        processed: {
          opportunities: [],
          diagnostics: [],
          resourceSummary: null,
          categoryGroups: {},
        },
        raw: null,
      };
    }

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
      status: 'partial',
      elapsedMs: Date.now() - startedAt,
      error: normalizeApiError(e),
      metrics: {
        scores: { performance: null, accessibility: null, seo: null },
        coreWebVitals: { lcp: null, cls: null, fcp: null, tbt: null, speedIndex: null },
      },
      processed: {
        opportunities: [],
        diagnostics: [],
        resourceSummary: null,
        categoryGroups: {},
      },
      raw: null,
    };
  }
};