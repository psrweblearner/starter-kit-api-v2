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
  return `pagespeed:result:${jobId}`;
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
      await client.set(buildResultKey(normalizedJobId), JSON.stringify(payload), 'EX', RESULT_TTL_SECONDS);
      return;
    } catch (_error) {
      // Fall back to memory.
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
      // Fall back to memory.
    }
  }

  return memoryStore.get(normalizedJobId) || null;
};

exports.clear = async (jobId) => {
  const normalizedJobId = String(jobId);
  const client = getRedisClient();

  if (client) {
    try {
      await client.del(buildResultKey(normalizedJobId));
    } catch (_error) {
      // Ignore redis clear failure.
    }
  }

  memoryStore.delete(normalizedJobId);
};
