'use strict';

const { getQueueConnection } = require('./queue/connection');

const LIVE_PREFIX = 'sitemap:live:';
const CANCEL_PREFIX = 'sitemap:cancel:';
const TTL_SEC = 3600;

function liveKey(jobId) {
  return `${LIVE_PREFIX}${String(jobId)}`;
}

function cancelKey(jobId) {
  return `${CANCEL_PREFIX}${String(jobId)}`;
}

function getRedis() {
  return getQueueConnection();
}

/**
 * @param {string} jobId
 * @param {object} payload
 * @param {number} [payload.urlsInSitemap]
 * @param {number} [payload.queueDepth]
 * @param {number} [payload.externalCount]
 * @param {number} [payload.notFoundCount]
 * @param {string[]} [payload.externalUrls]
 * @param {string[]} [payload.notFoundUrls]
 * @param {boolean} [payload.stopRequested]
 */
async function setProgress(jobId, payload) {
  const redis = getRedis();
  await redis.set(liveKey(jobId), JSON.stringify({ ...payload, updatedAt: Date.now() }), 'EX', TTL_SEC);
}

async function getProgress(jobId) {
  const redis = getRedis();
  const raw = await redis.get(liveKey(String(jobId)));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

async function requestStop(jobId) {
  const redis = getRedis();
  await redis.set(cancelKey(String(jobId)), '1', 'EX', TTL_SEC);
}

async function isStopRequested(jobId) {
  const redis = getRedis();
  const v = await redis.get(cancelKey(String(jobId)));
  return v === '1';
}

async function clearAll(jobId) {
  const redis = getRedis();
  const id = String(jobId);
  await redis.del(liveKey(id), cancelKey(id));
}

module.exports = {
  setProgress,
  getProgress,
  requestStop,
  isStopRequested,
  clearAll,
};
