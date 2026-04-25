'use strict';

const axios = require('axios');

module.exports = async function runPageSpeed(payload) {
  const startedAt = Date.now();
  const domain = String(payload.domain || '').trim();
  const strategy = String(payload.mode || 'mobile').trim().toLowerCase() === 'desktop' ? 'desktop' : 'mobile';
  if (!domain) {
    throw new Error('Invalid domain payload for PageSpeed job');
  }
  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const apiKey = String(process.env.PAGESPEED_API_KEY || '').trim();
  const params = {
    url: `https://${domain}`,
    category: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    strategy,
  };
  if (apiKey) params.key = apiKey;

  try {
    const data = await fetchPageSpeedWithRetry(endpoint, params);

    const categories = data?.lighthouseResult?.categories || {};
    const audits = data?.lighthouseResult?.audits || {};
    const environment = data?.lighthouseResult?.environment || {};
    const configSettings = data?.lighthouseResult?.configSettings || {};
    const finalScreenshot = getAuditScreenshot(audits['final-screenshot']);
    const fullPageScreenshot = getAuditScreenshot(audits['full-page-screenshot']);

    const report = {
      summary: {
        performance: scoreOf(categories.performance),
        accessibility: scoreOf(categories.accessibility),
        bestPractices: scoreOf(categories['best-practices']),
        seo: scoreOf(categories.seo),
        pwa: scoreOf(categories.pwa),
      },
      labMetrics: buildLabMetrics(audits),
      opportunities: buildOpportunities(audits),
      diagnostics: buildDiagnostics(audits),
      allAudits: buildAllAudits(audits),
      seoSnapshot: buildSeoSnapshot(audits),
      environment: {
        finalUrl: data?.lighthouseResult?.finalUrl || null,
        requestedUrl: data?.lighthouseResult?.requestedUrl || null,
        fetchTime: data?.lighthouseResult?.fetchTime || null,
        userAgent: environment.networkUserAgent || null,
        lighthouseVersion: environment.benchmarkIndex ? String(environment.benchmarkIndex) : null,
        strategy,
        emulatedFormFactor: configSettings.emulatedFormFactor || null,
        runtimeError: data?.lighthouseResult?.runtimeError?.message || null,
      },
      visualPreview: {
        finalScreenshot: finalScreenshot || null,
        fullPageScreenshot: fullPageScreenshot || null,
      },
      filesAssets: buildFilesAssets(audits),
    };

    return {
      status: 'completed',
      domain,
      mode: strategy,
      elapsedMs: Date.now() - startedAt,
      summary: {
        performance: scoreOf(categories.performance),
        accessibility: scoreOf(categories.accessibility),
        bestPractices: scoreOf(categories['best-practices']),
        seo: scoreOf(categories.seo),
        pwa: scoreOf(categories.pwa),
        coreWebVitals: {
          lcp: audits['largest-contentful-paint']?.displayValue || null,
          cls: audits['cumulative-layout-shift']?.displayValue || null,
          inp: audits['interaction-to-next-paint']?.displayValue || null,
          fcp: audits['first-contentful-paint']?.displayValue || null,
          tbt: audits['total-blocking-time']?.displayValue || null,
          speedIndex: audits['speed-index']?.displayValue || null,
        },
      },
      report,
      raw: buildCompactRawPayload(data),
    };
  } catch (error) {
    return {
      status: 'failed',
      domain,
      elapsedMs: Date.now() - startedAt,
      error: normalizeApiError(error),
      raw: null,
    };
  }
};

function scoreOf(category) {
  if (category?.score == null) return null;
  return Math.round(Number(category.score) * 100);
}

async function fetchPageSpeedWithRetry(endpoint, params) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { data } = await axios.get(endpoint, {
        timeout: 90000,
        params,
        paramsSerializer: (input) => {
          const search = new URLSearchParams();
          Object.entries(input || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((entry) => {
                if (entry != null) search.append(key, String(entry));
              });
              return;
            }
            if (value != null) search.append(key, String(value));
          });
          return search.toString();
        },
      });
      return data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const retryable = !status || status >= 500 || status === 429;
      if (!retryable || attempt === 2) break;
      await sleep(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

function buildLabMetrics(audits) {
  return [
    asMetric('first-contentful-paint', 'First Contentful Paint', audits),
    asMetric('largest-contentful-paint', 'Largest Contentful Paint', audits),
    asMetric('speed-index', 'Speed Index', audits),
    asMetric('total-blocking-time', 'Total Blocking Time', audits),
    asMetric('interactive', 'Time to Interactive', audits),
    asMetric('cumulative-layout-shift', 'Cumulative Layout Shift', audits),
    asMetric('interaction-to-next-paint', 'Interaction to Next Paint', audits),
  ];
}

function asMetric(id, label, audits) {
  const entry = audits[id] || {};
  return {
    id,
    label,
    value: entry.displayValue || null,
    score: typeof entry.score === 'number' ? Math.round(entry.score * 100) : null,
  };
}

function buildOpportunities(audits) {
  return Object.entries(audits)
    .filter(([, audit]) => audit?.details?.type === 'opportunity')
    .sort(([, a], [, b]) => (b?.numericValue || 0) - (a?.numericValue || 0))
    .map(([id, audit]) => ({
      id,
      title: audit?.title || id,
      description: audit?.description || null,
      displayValue: audit?.displayValue || null,
      score: typeof audit?.score === 'number' ? Math.round(audit.score * 100) : null,
      numericValue: audit?.numericValue ?? null,
    }));
}

function buildDiagnostics(audits) {
  return Object.entries(audits)
    .filter(([, audit]) => audit?.details?.type === 'diagnostic')
    .map(([id, audit]) => ({
      id,
      title: audit?.title || id,
      displayValue: audit?.displayValue || null,
      score: typeof audit?.score === 'number' ? Math.round(audit.score * 100) : null,
    }));
}

function buildAllAudits(audits) {
  return Object.entries(audits)
    .map(([id, audit]) => ({
      id,
      title: audit?.title || id,
      score: typeof audit?.score === 'number' ? Math.round(audit.score * 100) : null,
      scoreDisplayMode: audit?.scoreDisplayMode || null,
      displayValue: audit?.displayValue || null,
    }))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
}

function buildSeoSnapshot(audits) {
  const seoAudits = Object.entries(audits).filter(([id]) => id.startsWith('seo-') || id.includes('robots') || id.includes('canonical') || id.includes('hreflang'));
  const passed = [];
  const failed = [];
  const notApplicable = [];

  seoAudits.forEach(([, audit]) => {
    const title = audit?.title || 'Unknown';
    const mode = audit?.scoreDisplayMode;
    if (mode === 'notApplicable' || mode === 'manual') {
      notApplicable.push(title);
      return;
    }
    if (typeof audit?.score === 'number' && audit.score >= 0.9) {
      passed.push(title);
      return;
    }
    failed.push(title);
  });

  return { passed, failed, notApplicable };
}

function buildFilesAssets(audits) {
  const networkItems = Array.isArray(audits['network-requests']?.details?.items)
    ? audits['network-requests'].details.items
    : [];
  const topHeavyRequests = networkItems
    .map((item) => ({
      url: item?.url || null,
      resourceType: item?.resourceType || null,
      transferSize: Number(item?.transferSize || 0),
      resourceSize: Number(item?.resourceSize || 0),
    }))
    .filter((item) => item.url)
    .sort((a, b) => (b.transferSize || b.resourceSize) - (a.transferSize || a.resourceSize))
    .slice(0, 12);

  return {
    totalByteWeight: audits['total-byte-weight']?.displayValue || null,
    totalRequests: audits['network-requests']?.details?.items?.length || null,
    renderBlockingResources: audits['render-blocking-resources']?.displayValue || null,
    unusedJavascript: audits['unused-javascript']?.displayValue || null,
    unusedCss: audits['unused-css-rules']?.displayValue || null,
    imageElements: audits['image-elements']?.displayValue || null,
    modernImageFormats: audits['modern-image-formats']?.displayValue || null,
    efficientAnimatedContent: audits['efficient-animated-content']?.displayValue || null,
    resourceSummary: audits['resource-summary']?.details || null,
    topHeavyRequests,
  };
}

function getAuditScreenshot(audit) {
  const rawData = audit?.details?.data;
  if (typeof rawData === 'string' && rawData.startsWith('data:image/')) {
    return rawData;
  }
  return null;
}

function buildCompactRawPayload(data) {
  const lighthouseResult = data?.lighthouseResult || {};
  const categories = lighthouseResult.categories || {};
  const audits = lighthouseResult.audits || {};

  return {
    analysisUTCTimestamp: data?.analysisUTCTimestamp || null,
    id: data?.id || null,
    loadingExperience: data?.loadingExperience || null,
    lighthouseResult: {
      requestedUrl: lighthouseResult.requestedUrl || null,
      finalUrl: lighthouseResult.finalUrl || null,
      fetchTime: lighthouseResult.fetchTime || null,
      categories,
      configSettings: lighthouseResult.configSettings || null,
      environment: lighthouseResult.environment || null,
      audits: Object.fromEntries(
        Object.entries(audits).map(([auditId, audit]) => [
          auditId,
          {
            id: audit?.id || auditId,
            title: audit?.title || auditId,
            description: audit?.description || null,
            score: typeof audit?.score === 'number' ? audit.score : null,
            scoreDisplayMode: audit?.scoreDisplayMode || null,
            displayValue: audit?.displayValue || null,
            numericValue: typeof audit?.numericValue === 'number' ? audit.numericValue : null,
            detailsType: audit?.details?.type || null,
          },
        ])
      ),
    },
  };
}

function normalizeApiError(error) {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.error?.message;
  if (status && apiMessage) {
    return `PageSpeed API ${status}: ${apiMessage}`;
  }
  return error?.message || 'PageSpeed API failed';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
