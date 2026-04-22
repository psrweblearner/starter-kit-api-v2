'use strict';

const { Job } = require('../models');
const cache = require('./jobSnapshotCache');
const sitemapLive = require('./sitemapLive');

function normalizeProgress(status) {
  if (status === 'completed' || status === 'failed' || status === 'stopped' || status === 'partial') return 100;
  if (status === 'processing') return 8;
  return 3;
}

function sitemapProgressFromLive(live) {
  if (!live || typeof live.urlsInSitemap !== 'number') return null;
  const cap = Number(live.effectiveMaxUrls) > 0 ? Math.min(Number(live.effectiveMaxUrls), 10000) : 5000;
  const n = Math.max(0, live.urlsInSitemap);
  const ratio = Math.min(1, n / Math.max(cap, 50));
  return Math.min(92, Math.round(8 + ratio * 80));
}

function parseResult(resultData) {
  if (!resultData) return null;
  try {
    return JSON.parse(resultData);
  } catch (_error) {
    return null;
  }
}

function toSnapshot(jobRecord) {
  if (!jobRecord) return null;
  const result = parseResult(jobRecord.resultData);
  let status = jobRecord.status;
  if (jobRecord.type === 'sitemap' && result && (result.status === 'stopped' || result.status === 'partial')) {
    status = result.status;
  }
  return {
    jobId: String(jobRecord.id),
    type: jobRecord.type,
    status,
    progress: normalizeProgress(status),
    attempts: Number(jobRecord.attempts || 0),
    error: jobRecord.error || null,
    data: result,
    updatedAt: jobRecord.updated_at || jobRecord.updatedAt || null,
  };
}

async function getSnapshot(jobId) {
  const normalizedJobId = String(jobId);
  const cached = await cache.get(normalizedJobId);
  if (cached) return cached;

  const jobRecord = await Job.findByPk(normalizedJobId);
  if (!jobRecord) {
    return {
      jobId: normalizedJobId,
      status: 'failed',
      progress: 100,
      error: 'Job not found',
      data: null,
    };
  }

  const snapshot = toSnapshot(jobRecord);
  if (snapshot.type === 'sitemap' && (snapshot.status === 'processing' || snapshot.status === 'pending')) {
    const live = await sitemapLive.getProgress(normalizedJobId);
    if (live) {
      snapshot.live = live;
      const p = sitemapProgressFromLive(live);
      if (p !== null) snapshot.progress = p;
    }
  }
  if (snapshot.status !== 'processing' && snapshot.status !== 'pending') {
    await cache.set(normalizedJobId, snapshot);
  }
  return snapshot;
}

async function clearSnapshot(jobId) {
  await cache.clear(String(jobId));
}

module.exports = {
  getSnapshot,
  clearSnapshot,
};
