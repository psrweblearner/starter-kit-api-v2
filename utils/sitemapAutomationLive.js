'use strict';

const { getQueueConnection } = require('./queue/connection');

const LIVE_PREFIX = 'sitemap-automation:live:';
const TTL_SEC = 3600;

function liveKey(runId) {
  return `${LIVE_PREFIX}${String(runId)}`;
}

function getRedis() {
  return getQueueConnection();
}

async function setProgress(runId, payload) {
  const redis = getRedis();
  await redis.set(liveKey(runId), JSON.stringify({ ...payload, updatedAt: Date.now() }), 'EX', TTL_SEC);
}

async function getProgress(runId) {
  const redis = getRedis();
  const raw = await redis.get(liveKey(runId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

async function clearProgress(runId) {
  const redis = getRedis();
  await redis.del(liveKey(runId));
}

module.exports = {
  setProgress,
  getProgress,
  clearProgress,
};
