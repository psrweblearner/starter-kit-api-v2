'use strict';

const Redis = require('ioredis');

const store = new Map();
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

function buildKey(jobId) {
  return `competitor:result:${jobId}`;
}

exports.save = async (jobId, data) => {
  const normalizedJobId = String(jobId);
  const client = getRedisClient();

  if (client) {
    try {
      await client.set(buildKey(normalizedJobId), JSON.stringify(data), 'EX', RESULT_TTL_SECONDS);
      return;
    } catch (_error) {
      // Fall back to in-memory store if Redis write fails.
    }
  }

  store.set(normalizedJobId, data);
};

exports.get = async (jobId) => {
  const normalizedJobId = String(jobId);
  const client = getRedisClient();

  if (client) {
    try {
      const raw = await client.get(buildKey(normalizedJobId));
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      // Fall back to in-memory store if Redis read fails.
    }
  }

  return store.get(normalizedJobId) || null;
};