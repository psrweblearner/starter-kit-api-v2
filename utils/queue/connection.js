'use strict';
require('dotenv').config({ override: process.env.NODE_ENV !== 'production' });

const { Queue } = require('bullmq');
const IORedis = require('ioredis');

let sharedConnection;
let ensureNoEvictionPromise;
let sharedJobsQueue;
const skipVersionCheck = process.env.BULLMQ_SKIP_VERSION_CHECK !== 'false';
const JOBS_QUEUE_NAME = 'jobs';

const defaultAttempts = Number(process.env.BULLMQ_JOB_ATTEMPTS || 2);
const defaultBackoffMs = Number(process.env.BULLMQ_BACKOFF_DELAY_MS || 5000);

async function ensureNoEvictionPolicy(connection) {
  if (ensureNoEvictionPromise) return ensureNoEvictionPromise;

  ensureNoEvictionPromise = (async () => {
    try {
      const current = await connection.config('GET', 'maxmemory-policy');
      const currentPolicy = Array.isArray(current) ? current[1] : null;
      if (!currentPolicy || currentPolicy === 'noeviction') return;

      await connection.config('SET', 'maxmemory-policy', 'noeviction');
      const afterSet = await connection.config('GET', 'maxmemory-policy');
      const updatedPolicy = Array.isArray(afterSet) ? afterSet[1] : null;

      if (updatedPolicy !== 'noeviction') {
        console.warn(
          `WARNING: Redis maxmemory-policy is "${updatedPolicy || currentPolicy}". Set it to "noeviction" in your Redis server config.`
        );
      }
    } catch (error) {
      // Managed Redis providers can block CONFIG commands; keep startup resilient.
      console.warn(
        'WARNING: Could not enforce Redis maxmemory-policy=noeviction automatically. Configure it at the Redis server level.',
        error?.message || error
      );
    }
  })();

  return ensureNoEvictionPromise;
}

function getQueueConnection() {
  if (sharedConnection) return sharedConnection;
  sharedConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  ensureNoEvictionPolicy(sharedConnection);
  return sharedConnection;
}

function getJobsQueue() {
  if (sharedJobsQueue) return sharedJobsQueue;
  sharedJobsQueue = new Queue(JOBS_QUEUE_NAME, {
    connection: getQueueConnection(),
    skipVersionCheck,
    defaultJobOptions: {
      attempts: defaultAttempts,
      backoff: {
        type: 'exponential',
        delay: defaultBackoffMs,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  });
  return sharedJobsQueue;
}

function getQueue(_name) {
  return getJobsQueue();
}

async function getQueueStats() {
  const queue = getJobsQueue();
  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  return {
    queue: JOBS_QUEUE_NAME,
    counts,
  };
}

module.exports = {
  JOBS_QUEUE_NAME,
  getQueueConnection,
  getJobsQueue,
  getQueue,
  getQueueStats,
};
