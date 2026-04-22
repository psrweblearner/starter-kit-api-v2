'use strict';

const IORedis = require('ioredis');

const TTL_SECONDS = Number(process.env.JOB_CACHE_TTL_SECONDS || 300);
const MAX_CACHE_BYTES = Number(process.env.JOB_CACHE_MAX_BYTES || 8192);

let cacheClient;

function getClient() {
  if (cacheClient !== undefined) return cacheClient;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    cacheClient = null;
    return cacheClient;
  }

  try {
    cacheClient = new IORedis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    cacheClient.on('error', () => {});
  } catch (_error) {
    cacheClient = null;
  }
  return cacheClient;
}

function buildKey(jobId) {
  return `jobs:snapshot:${jobId}`;
}

async function get(jobId) {
  const client = getClient();
  if (!client) return null;
  try {
    const raw = await client.get(buildKey(jobId));
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

async function set(jobId, value) {
  const client = getClient();
  if (!client || !value) return;

  try {
    const payload = JSON.stringify(value);
    if (Buffer.byteLength(payload, 'utf8') > MAX_CACHE_BYTES) return;
    await client.set(buildKey(jobId), payload, 'EX', TTL_SECONDS);
  } catch (_error) {
    // Ignore cache write failures.
  }
}

async function clear(jobId) {
  const client = getClient();
  if (!client) return;
  try {
    await client.del(buildKey(jobId));
  } catch (_error) {
    // Ignore cache clear failures.
  }
}

module.exports = {
  get,
  set,
  clear,
};
