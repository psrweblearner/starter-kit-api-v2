'use strict';

const fs = require('fs/promises');
const axios = require('axios');
const { AutomationRun, AutomationSite } = require('../../../models');
const buildSitemap = require('../sitemap/crawl-and-build.service');
const sitemapAutomationLive = require('../../../utils/sitemapAutomationLive');
const { submitToGoogleIndexing } = require('./google-index.service');
const { buildAutomationStartUrl } = require('../../../utils/automationHost');

module.exports = async function runAutomation(payload) {
  const runId = Number(payload?.runId || 0);
  if (!Number.isInteger(runId) || runId <= 0) {
    throw new Error('Invalid automation run id');
  }

  const run = await AutomationRun.findByPk(runId);
  if (!run) throw new Error(`Automation run ${runId} not found`);

  const site = await AutomationSite.findByPk(run.siteId);
  if (!site) throw new Error(`Automation site ${run.siteId} not found`);

  await run.update({
    status: 'processing',
    startedAt: new Date(),
    finishedAt: null,
    errorSummary: null,
  });

  try {
    await sitemapAutomationLive.setProgress(runId, {
      stage: 'processing',
      discoveredCount: 0,
      failedCount: 0,
      externalCount: 0,
      statusText: 'Starting crawl',
    });

    const sitemapResult = await buildSitemap({
      jobId: null,
      domain: site.domain,
      startUrl: buildAutomationStartUrl(site.domain),
      includeImages: true,
      includeVideos: true,
      maxUrls: 50000,
      maxDepth: 10,
      concurrency: 12,
    });

    await sitemapAutomationLive.setProgress(runId, {
      stage: 'indexing',
      discoveredCount: sitemapResult.totalUrls || 0,
      failedCount: sitemapResult.failedCount || 0,
      externalCount: sitemapResult.externalCount || 0,
      statusText: 'Submitting indexing signals',
      sitemapUrl: sitemapResult.sitemapUrl || null,
    });

    const urlsForIndexing = await extractIndexableUrls(sitemapResult.generatedFiles);
    const indexing = await submitToGoogleIndexing({
      sitemapUrl: sitemapResult.sitemapUrl || null,
      site,
      urls: urlsForIndexing,
    });
    const publish = await publishSitemapToConnectedSite({
      site,
      sitemapResult,
    });

    await run.update({
      status: sitemapResult.status === 'failed' ? 'failed' : 'completed',
      finishedAt: new Date(),
      discoveredCount: Number(sitemapResult.totalUrls || 0),
      failedCount: Number(sitemapResult.failedCount || 0),
      externalCount: Number(sitemapResult.externalCount || 0),
      sitemapUrl: sitemapResult.sitemapUrl || null,
      indexSubmittedCount: Number(indexing.submittedCount || 0),
      indexFailedCount: Number(indexing.failedCount || 0),
      errorSummary: [...(indexing.errors || []), ...(publish.errors || [])].length
        ? [...(indexing.errors || []), ...(publish.errors || [])].join(' | ')
        : null,
      resultData: JSON.stringify({
        sitemap: sitemapResult,
        indexing,
        publish,
      }),
    });

    await site.update({
      lastRunAt: new Date(),
      lastPublishAt: publish.status === 'success' ? new Date() : site.lastPublishAt,
      lastPublishStatus: publish.status,
      lastPublishMessage: publish.message,
    });

    await sitemapAutomationLive.setProgress(runId, {
      stage: 'completed',
      discoveredCount: Number(sitemapResult.totalUrls || 0),
      failedCount: Number(sitemapResult.failedCount || 0),
      externalCount: Number(sitemapResult.externalCount || 0),
      statusText: 'Automation run completed',
      sitemapUrl: sitemapResult.sitemapUrl || null,
      indexSubmittedCount: Number(indexing.submittedCount || 0),
      indexFailedCount: Number(indexing.failedCount || 0),
      publishStatus: publish.status,
    });

    return {
      runId,
      siteId: Number(site.id),
      status: 'completed',
      sitemapUrl: sitemapResult.sitemapUrl || null,
      discoveredCount: Number(sitemapResult.totalUrls || 0),
      failedCount: Number(sitemapResult.failedCount || 0),
      externalCount: Number(sitemapResult.externalCount || 0),
      indexSubmittedCount: Number(indexing.submittedCount || 0),
      indexFailedCount: Number(indexing.failedCount || 0),
      publishStatus: publish.status,
    };
  } catch (error) {
    await run.update({
      status: 'failed',
      finishedAt: new Date(),
      errorSummary: error?.message || 'Automation run failed',
    });
    await sitemapAutomationLive.setProgress(runId, {
      stage: 'failed',
      statusText: error?.message || 'Automation run failed',
    });
    throw error;
  }
};

async function extractIndexableUrls(generatedFiles) {
  const files = Array.isArray(generatedFiles) ? generatedFiles : [];
  const maxUrls = normalizeMaxUrls(process.env.WEB_INDEX_MAX_URLS_PER_RUN, 1000);
  const output = [];
  const seen = new Set();

  for (const filePath of files) {
    if (output.length >= maxUrls) break;
    if (!filePath) continue;
    let raw = '';
    try {
      raw = await fs.readFile(String(filePath), 'utf8');
    } catch (_error) {
      continue;
    }

    if (!raw.includes('<urlset')) continue;
    const locMatches = raw.matchAll(/<loc>([^<]+)<\/loc>/g);
    for (const match of locMatches) {
      if (output.length >= maxUrls) break;
      const url = String(match?.[1] || '').trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      output.push(url);
    }
  }

  return output;
}

function normalizeMaxUrls(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(5000, Math.max(1, Math.floor(parsed)));
}

async function publishSitemapToConnectedSite({ site, sitemapResult }) {
  const endpoint = normalizePublishEndpoint(site.publishEndpoint);
  const secret = String(site.publishSecret || '').trim();
  const targetPath = String(site.publishPath || 'public/sitemap.xml').trim();
  if (!endpoint || !secret) {
    return {
      status: 'not-configured',
      message: 'Publish endpoint not configured',
      errors: [],
    };
  }

  const generated = Array.isArray(sitemapResult.generatedFiles) ? sitemapResult.generatedFiles : [];
  const primaryFile = generated.find((filePath) => String(filePath || '').toLowerCase().endsWith('.xml')) || sitemapResult.sitemapFilePath;
  let sitemapXml = '';
  if (primaryFile) {
    try {
      sitemapXml = await fs.readFile(String(primaryFile), 'utf8');
    } catch (_error) {
      sitemapXml = '';
    }
  }
  if (!sitemapXml) {
    return {
      status: 'failed',
      message: 'Generated sitemap XML not found for publish',
      errors: ['Generated sitemap XML not found for publish'],
    };
  }

  try {
    const response = await axios.post(
      endpoint,
      {
        sitemapXml,
        domain: site.domain,
        generatedAt: new Date().toISOString(),
        targetPath,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-sitemap-secret': secret,
        },
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 500,
      }
    );
    if (response.status >= 200 && response.status < 300) {
      return {
        status: 'success',
        message: response.data?.message || 'Sitemap published to connected site',
        errors: [],
      };
    }
    return {
      status: 'failed',
      message: response.data?.error || `Publish failed with status ${response.status}`,
      errors: [response.data?.error || `Publish failed with status ${response.status}`],
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error?.message || 'Publish request failed',
      errors: [error?.message || 'Publish request failed'],
    };
  }
}

function normalizePublishEndpoint(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}
