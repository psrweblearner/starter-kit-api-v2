'use strict';
const NodeCache = require('node-cache');
const Redis = require('ioredis');
const { Redis: UpstashRedis } = require('@upstash/redis');
const { CacheConfig } = require('../models');
const logger = require('./logger');

// Store active backend instances and configurations
let localNodeCache = null;
let redisClient = null;
let upstashClient = null;
// Internal cache for configurations (TTL: 30 mins)
const configCache = new NodeCache({ stdTTL: 1800 });

// Track backend health to avoid repeated timeouts (Circuit Breaker)
const backendStatus = {
  redis: { down: false, lastAttempt: 0 },
  upstash: { down: false, lastAttempt: 0 }
};
const RECOVERY_TIME = 30000; // 30 seconds

/**
 * Initialize backends for a specific config
 */
function initializeBackends(conf) {
  // Initialize NodeCache
  if ((conf.primary_backend === 'node-cache' || conf.secondary_backend === 'node-cache') && !localNodeCache) {
    localNodeCache = new NodeCache(conf.node_cache_config || { stdTTL: 86400 });
  }

  // Initialize IORedis
  if ((conf.primary_backend === 'redis' || conf.secondary_backend === 'redis') && !redisClient) {
    try {
      const redisUrl = process.env.REDIS_URL || conf.redis_config?.url;
      if (redisUrl) {
        redisClient = new Redis(redisUrl, {
          connectTimeout: 1000,
          commandTimeout: 700,
          maxRetriesPerRequest: 0,
          lazyConnect: true
        });
        redisClient.on('error', (err) => {
          if (backendStatus.redis) {
            backendStatus.redis.down = true;
            backendStatus.redis.lastAttempt = Date.now();
          }
        });
      }
    } catch (e) {
      logger.error('Redis Init Failed', e);
    }
  }

  // Initialize Upstash
  if ((conf.primary_backend === 'upstash' || conf.secondary_backend === 'upstash') && !upstashClient) {
    try {
      let upstashUrl = process.env.UPSTASH_REDIS_URL || conf.upstash_config?.url;
      const upstashToken = process.env.UPSTASH_REDIS_TOKEN || conf.upstash_config?.token;

      if (upstashUrl) {
        const urlOnly = upstashUrl.replace('rediss://', '').replace('redis://', '').split('@').pop().split(':')[0];
        upstashClient = new UpstashRedis({
          url: `https://${urlOnly}`,
          token: upstashToken || upstashUrl.split('@')[0].split(':').pop(),
        });
      }
    } catch (e) {
      logger.error('Upstash Init Failed', e);
    }
  }
}

/**
 * Get config for a specific scope (admin/public) with Lazy Loading
 */
async function getConfig(req) {
  const scope = req?.user ? 'admin' : 'public';
  // 1. Check Internal Config Cache
  const cachedConfig = configCache.get(scope);
  if (cachedConfig) {
    return cachedConfig;
  }

  // 2. Fetch from DB (On Demand)
  try {
    const conf = await CacheConfig.findOne({ where: { scope, is_active: true } });
    if (conf) {
      const configData = conf.toJSON();
      initializeBackends(configData); // Ensure connections exist
      configCache.set(scope, configData); // Store in NodeCache (30m TTL)
      return configData;
    }
  } catch (err) {
    logger.error(`Error fetching cache config for scope: ${scope}`, err);
  }
  return null;
}

/**
 * Check if a backend is healthy enough to try
 */
function isHealthy(backend) {
  if (!backendStatus[backend]) return true; // node-cache is always healthy
  const status = backendStatus[backend];
  if (!status.down) return true;

  if (Date.now() - status.lastAttempt > RECOVERY_TIME) {
    logger.info(`Attempting recovery for cache backend: ${backend}`);
    status.down = false; // Reset on recovery attempt
    return true;
  }
  return false;
}

/**
 * Get data from a specific backend
 */
async function fetchFromBackend(backend, key) {
  if (!backend && backend !== 'node-cache') return null;
  if (!isHealthy(backend)) return null;

  try {
    switch (backend) {
      case 'node-cache':
        return localNodeCache ? localNodeCache.get(key) : null;
      case 'redis':
        if (!redisClient) return null;
        const redisData = await withTimeout(redisClient.get(key), 700, 'Redis');
        return redisData ? JSON.parse(redisData) : null;
      case 'upstash':
        if (!upstashClient) return null;
        const upstashData = await withTimeout(upstashClient.get(key), 700, 'Upstash');
        return upstashData ? (typeof upstashData === 'string' ? JSON.parse(upstashData) : upstashData) : null;
      default:
        return null;
    }
  } catch (err) {
    if (backendStatus[backend]) {
      backendStatus[backend].down = true;
      backendStatus[backend].lastAttempt = Date.now();
      logger.warn(`Circuit Breaker: Marking [${backend}] as DOWN for 30s`, { error: err.message });
    }
    return null;
  }
}

/**
 * Save data to a specific backend
 */
async function saveToBackend(backend, key, value, ttl) {
  try {
    const stringValue = JSON.stringify(value);
    switch (backend) {
      case 'node-cache':
        if (localNodeCache) localNodeCache.set(key, value, ttl);
        break;
      case 'redis':
        if (redisClient) await redisClient.set(key, stringValue, 'EX', ttl);
        break;
      case 'upstash':
        if (upstashClient) await upstashClient.set(key, stringValue, { ex: ttl });
        break;
    }
  } catch (err) {
    logger.warn(`Cache Backend [${backend}] write failed`, { key, error: err.message });
  }
}

/**
 * Simply clear memory cache to force re-fetch on next request
 * @param {string} [scope] - Optional scope to clear
 */
async function refreshConfigs(scope = null) {
  if (scope) {
    configCache.del(scope);
    logger.info(`Cache config cleared for scope: ${scope}`);
  } else {
    configCache.flushAll();

    // Also flush actual data backends if initialized (Nuclear Option for full revalidation)
    if (localNodeCache) {
      localNodeCache.flushAll();
    }

    if (redisClient) {
      try {
        await redisClient.flushdb();
      } catch (err) {
        logger.error('Redis FlushDB Failed', err);
      }
    }

    if (upstashClient) {
      try {
        await upstashClient.flushdb();
      } catch (err) {
        logger.error('Upstash FlushDB Failed', err);
      }
    }

    logger.info('Cache config and all data backends flushed (Full Revalidation)');
  }
}

/**
 * Helper to wrap promises with a timeout
 */
async function withTimeout(promise, ms, backendName) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${backendName} timeout`)), ms)
  );
  return Promise.race([promise, timeout]);
}

const getCache = async (req, key) => {
  const config = await getConfig(req);
  if (!config) return { data: null, name: 'db' };

  let data = await fetchFromBackend(config.primary_backend, key);
  if (data) return { data, name: config.primary_backend };

  // 🏎️ Try Fallback if Primary miss or fail
  if (config.secondary_backend && config.secondary_backend !== 'none') {
    data = await fetchFromBackend(config.secondary_backend, key);
    if (data) return { data, name: config.secondary_backend };
  }

  return { data: null, name: 'db' };
};

const setCache = async (req, key, value, ttl) => {
  const config = await getConfig(req);
  if (!config) return null;

  // ⏱️ Determine TTL: Passed value > DB Config > 3600 fallback
  const finalTtl = ttl || config.node_cache_config?.stdTTL || 86400;

  // 🚀 Start saves in parallel and DON'T wait for them
  saveToBackend(config.primary_backend, key, value, finalTtl);

  if (config.secondary_backend && config.secondary_backend !== 'none') {
    saveToBackend(config.secondary_backend, key, value, finalTtl);
  }
};

/**
 * Delete cache key(s)
 * @param {Object} req - Express req for config resolution
 * @param {String} key - Key or Pattern (if isPattern=true)
 * @param {Boolean} isPattern - If true, treats key as wildcard pattern (e.g. "users:*")
 */
const delCache = async (req, key, isPattern = false) => {
  const config = await getConfig(req);
  if (!config) return;

  const backends = [config.primary_backend, config.secondary_backend].filter(b => b && b !== 'none');

  for (const backend of backends) {
    if (!isHealthy(backend)) continue; // Skip unhealthy backends

    try {
      if (!isPattern) {
        // Simple Single Delete
        if (backend === 'node-cache' && localNodeCache) localNodeCache.del(key);
        if (backend === 'redis' && redisClient) await withTimeout(redisClient.del(key), 1000, 'Redis Del');
        if (backend === 'upstash' && upstashClient) await withTimeout(upstashClient.del(key), 1500, 'Upstash Del');
      } else {
        // Pattern Delete (Wildcard)
        if (backend === 'node-cache' && localNodeCache) {
          const keys = localNodeCache.keys();
          const matches = keys.filter(k => k.startsWith(key.replace('*', '')));
          if (matches.length) localNodeCache.del(matches);
        }

        if (backend === 'redis' && redisClient) {
          let cursor = '0';
          let loopCount = 0;
          do {
            const result = await withTimeout(redisClient.scan(cursor, 'MATCH', key, 'COUNT', 100), 1000, 'Redis Scan');
            cursor = result[0];
            const keys = result[1];
            if (keys.length) await withTimeout(redisClient.del(keys), 1000, 'Redis Del');
            loopCount++;
            if (loopCount > 100) break; // Circuit break for safety
          } while (cursor !== '0');
        }

        if (backend === 'upstash' && upstashClient) {
          let cursor = 0;
          let loopCount = 0;
          do {
            const [nextCursor, keys] = await withTimeout(upstashClient.scan(cursor, { match: key, count: 100 }), 1500, 'Upstash Scan');
            cursor = nextCursor;
            if (keys.length) await withTimeout(upstashClient.del(...keys), 1500, 'Upstash Del');
            loopCount++;
            if (loopCount > 100) break; // Circuit break
          } while (cursor !== 0 && cursor !== "0"); // Robust check
        }
      }
    } catch (err) {
      logger.error(`Cache Delete Failed [${backend}]`, { key, error: err.message });
      // Mark backend as potentially down if it timed out? simplified for now just log
    }
  }
};

module.exports = {
  getCache,
  setCache,
  delCache,
  refreshConfigs
};
