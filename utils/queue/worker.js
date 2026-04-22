'use strict';
require('dotenv').config({ override: process.env.NODE_ENV !== 'production' });

const { Worker } = require('bullmq');
const { Job } = require('../../models');
const pageSpeed = require('../../services/v1/competitor/pagespeed.service');
const scrape = require('../../services/v1/competitor/scrape.service');
const technicalChecks = require('../../services/v1/competitor/sitemap.service');
const googleMaps = require('../../services/v1/competitor/googlemaps.service');
const buildSitemap = require('../../services/v1/sitemap/crawl-and-build.service');
const runSitemapAutomation = require('../../services/v1/sitemap-automation/run-automation.service');
const buildQr = require('../../services/v1/qr/build-qr.service');
const runPageSpeed = require('../../services/v1/pagespeed/run-pagespeed.service');
const { publishJobEvent } = require('./job-notification');
const { clearSnapshot } = require('../jobSnapshot');
const { getQueueConnection, JOBS_QUEUE_NAME } = require('./connection');
const { normalizeDomain } = require('../domain');
const { normalizeAutomationHost } = require('../automationHost');

const connection = getQueueConnection();
const skipVersionCheck = process.env.BULLMQ_SKIP_VERSION_CHECK !== 'false';
const lockDurationMs = Number(process.env.BULLMQ_LOCK_DURATION_MS || 120000);
const stalledIntervalMs = Number(process.env.BULLMQ_STALLED_INTERVAL_MS || 30000);
const maxStalledCount = Number(process.env.BULLMQ_MAX_STALLED_COUNT || 2);
const workerConcurrency = Number(process.env.BULLMQ_WORKER_CONCURRENCY || 4);

function workerOptions() {
  return {
    connection,
    concurrency: workerConcurrency,
    skipVersionCheck,
    lockDuration: lockDurationMs,
    stalledInterval: stalledIntervalMs,
    maxStalledCount,
  };
}

new Worker(
  JOBS_QUEUE_NAME,
  async (job) => {
    const queueJobId = String(job?.data?.jobId || '');
    const jobType = String(job?.data?.type || '');
    if (!queueJobId || !jobType) {
      throw new Error('Invalid queue payload. Expected { jobId, type }.');
    }

    const dbJob = await Job.findByPk(queueJobId);
    if (!dbJob) {
      throw new Error(`Job ${queueJobId} not found in database`);
    }

    const currentAttempt = Number(job.attemptsMade || 0) + 1;
    const maxAttempts = Number(job.opts?.attempts || 1);

    await dbJob.update({
      status: 'processing',
      attempts: currentAttempt,
      error: null,
      resultData: null,
    });
    await clearSnapshot(queueJobId);
    await publishJobEvent({
      jobId: queueJobId,
      status: 'processing',
      type: jobType,
      attempts: currentAttempt,
    });

    try {
      const payload = parseInputData(dbJob.inputData);
      if (jobType === 'sitemap') {
        payload.jobId = queueJobId;
      }
      const result = await processByType(jobType, payload);

      await dbJob.update({
        status: 'completed',
        resultData: JSON.stringify(result),
        error: null,
        attempts: currentAttempt,
      });
      await clearSnapshot(queueJobId);
      await publishJobEvent({
        jobId: queueJobId,
        status: 'completed',
        type: jobType,
      });
      return { jobId: queueJobId, type: jobType, status: 'completed' };
    } catch (error) {
      const shouldFail = currentAttempt >= maxAttempts;
      await dbJob.update({
        status: shouldFail ? 'failed' : 'pending',
        error: error?.message || 'Job failed',
        attempts: currentAttempt,
        ...(shouldFail ? {} : { resultData: null }),
      });
      await clearSnapshot(queueJobId);
      await publishJobEvent({
        jobId: queueJobId,
        status: shouldFail ? 'failed' : 'retrying',
        type: jobType,
        error: error?.message || 'Job failed',
        attempts: currentAttempt,
      });
      throw error;
    }
  },
  workerOptions()
);

async function processByType(type, payload) {
  validatePayload(type, payload);
  switch (type) {
    case 'sitemap':
      return buildSitemap(payload || {});
    case 'speed':
      return runPageSpeed(payload || {});
    case 'qr':
      return buildQr(payload || {});
    case 'competitor':
      return processCompetitor(payload || {});
    case 'sitemap_automation':
      return runSitemapAutomation(payload || {});
    default:
      throw new Error(`Unsupported job type: ${type}`);
  }
}

function validatePayload(type, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid payload for job type "${type}"`);
  }

  if (type === 'sitemap' || type === 'speed' || type === 'competitor') {
    const normalized = normalizeDomain(payload.domain);
    if (!normalized) {
      throw new Error(`Invalid domain for job type "${type}"`);
    }
    payload.domain = normalized;
  }

  if (type === 'sitemap_automation') {
    const normalized = normalizeAutomationHost(payload.domain);
    if (!normalized) {
      throw new Error(`Invalid domain for job type "${type}"`);
    }
    payload.domain = normalized;
  }

  if (type === 'competitor') {
    const competitors = Array.isArray(payload.competitors) ? payload.competitors : [];
    const normalizedCompetitors = competitors.map((value) => normalizeDomain(value)).filter(Boolean);
    if (!normalizedCompetitors.length || normalizedCompetitors.length !== competitors.length) {
      throw new Error('Invalid competitor domain(s) in job payload');
    }
    payload.competitors = normalizedCompetitors;
  }
}

function parseInputData(inputData) {
  if (!inputData) return {};
  if (typeof inputData === 'object') return inputData;
  if (typeof inputData !== 'string') return {};
  try {
    const parsed = JSON.parse(inputData);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

async function processCompetitor(payload) {
  const domain = String(payload.domain || '');
  const competitors = Array.isArray(payload.competitors) ? payload.competitors : [];
  const businessName = payload.businessName ? String(payload.businessName) : null;

  const yourSite = await analyzeDomain(domain, businessName || null);
  const competitorSettled = await Promise.allSettled(
    competitors.map((comp) => analyzeDomain(comp, comp))
  );
  const competitorResults = competitorSettled.map((entry, index) => {
    if (entry.status === 'fulfilled') return entry.value;
    return {
      domain: competitors[index],
      status: 'failed',
      elapsedMs: 0,
      tasks: {
        pageSpeed: 'failed',
        scraping: 'failed',
        technicalChecks: 'failed',
        googleMaps: 'failed',
      },
      data: {
        pageSpeed: null,
        scraping: null,
        technicalChecks: null,
        googleMaps: null,
      },
      errors: [{ task: 'domain-analysis', error: entry.reason?.message || 'Domain task crashed' }],
    };
  });

  const allSites = [yourSite, ...competitorResults];
  const completedCount = allSites.filter((site) => site.status === 'completed').length;
  const partialCount = allSites.filter((site) => site.status === 'partial').length;
  const failedCount = allSites.filter((site) => site.status === 'failed').length;
  const totalErrors = allSites.reduce((sum, site) => sum + (site.errors?.length || 0), 0);

  return {
    summary: {
      status: failedCount > 0 ? 'partial' : 'completed',
      generatedAt: new Date().toISOString(),
      totalDomainsAnalyzed: allSites.length,
      completedDomains: completedCount,
      partialDomains: partialCount,
      failedDomains: failedCount,
      totalErrors,
    },
    yourSite,
    competitors: competitorResults,
  };
}

async function analyzeDomain(currentDomain, mapsBusinessName = null) {
  const startedAt = Date.now();
  const [ps, sc, tc, gm] = await Promise.allSettled([
    pageSpeed(currentDomain),
    scrape(currentDomain),
    technicalChecks(currentDomain),
    googleMaps({ domain: currentDomain, businessName: mapsBusinessName }),
  ]);

  const pageSpeedResult = settledResult(ps, 'PageSpeed task crashed');
  const scrapeResult = settledResult(sc, 'Scraping task crashed');
  const technicalResult = settledResult(tc, 'Technical checks task crashed');
  const mapsResult = settledResult(gm, 'Google Maps task crashed');

  const taskStatuses = {
    pageSpeed: pageSpeedResult.status,
    scraping: scrapeResult.status,
    technicalChecks: technicalResult.status,
    googleMaps: mapsResult.status,
  };
  const failedTasks = Object.entries(taskStatuses)
    .filter(([, status]) => status === 'failed')
    .map(([name]) => name);

  return {
    domain: currentDomain,
    status: failedTasks.length ? 'partial' : 'completed',
    elapsedMs: Date.now() - startedAt,
    tasks: taskStatuses,
    data: {
      pageSpeed: pageSpeedResult,
      scraping: scrapeResult,
      technicalChecks: technicalResult,
      googleMaps: mapsResult,
    },
    errors: failedTasks.map((taskName) => {
      const source = {
        pageSpeed: pageSpeedResult,
        scraping: scrapeResult,
        technicalChecks: technicalResult,
        googleMaps: mapsResult,
      }[taskName];
      return { task: taskName, error: source.error || 'Task failed' };
    }),
  };
}

function settledResult(settled, defaultError) {
  if (settled.status === 'fulfilled') {
    const value = settled.value;
    if (value && typeof value === 'object' && value.status) {
      return value;
    }
    return {
      status: 'completed',
      data: value,
      error: null,
      raw: value,
    };
  }

  return {
    status: 'failed',
    error: settled.reason?.message || defaultError,
    data: null,
    raw: null,
  };
}