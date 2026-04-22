'use strict';

const Redis = require('ioredis');

const memoryStore = new Map();
const RESULT_TTL_SECONDS = 24 * 60 * 60;
let redisClient;

function getRedisClient() {
  if (redisClient !== undefined) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    redisClient = null;
    return redisClient;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    redisClient.on('error', () => {});
  } catch (_error) {
    redisClient = null;
  }

  return redisClient;
}

function buildResultKey(jobId) {
  return `sitemap:result:${jobId}`;
}

function buildFileKey(jobId) {
  return `sitemap:file:${jobId}`;
}

exports.save = async (jobId, data) => {
  const normalizedJobId = String(jobId);
  const payload = {
    ...data,
    jobId: normalizedJobId,
  };
  const client = getRedisClient();

  if (client) {
    try {
      await client.multi()
        .set(buildResultKey(normalizedJobId), JSON.stringify(payload), 'EX', RESULT_TTL_SECONDS)
        .set(buildFileKey(normalizedJobId), String(payload.sitemapUrl || ''), 'EX', RESULT_TTL_SECONDS)
        .exec();
      return;
    } catch (_error) {
      // Fall back to memory store.
    }
  }

  memoryStore.set(normalizedJobId, payload);
};

exports.get = async (jobId) => {
  const normalizedJobId = String(jobId);
  const client = getRedisClient();

  if (client) {
    try {
      const raw = await client.get(buildResultKey(normalizedJobId));
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      // Fall back to memory store.
    }
  }

  return memoryStore.get(normalizedJobId) || null;
};

exports.clear = async (jobId) => {
  const normalizedJobId = String(jobId);
  const client = getRedisClient();

  if (client) {
    try {
      await client.del(buildResultKey(normalizedJobId), buildFileKey(normalizedJobId));
    } catch (_error) {
      // Ignore Redis clear failure and continue with memory cleanup.
    }
  }

  memoryStore.delete(normalizedJobId);
};
