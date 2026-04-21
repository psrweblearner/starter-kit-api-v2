'use strict';

const { EventEmitter } = require('events');
const IORedis = require('ioredis');

const CHANNEL = 'competitor:job-events';
const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(0);

let publisher;
let subscriber;
let subscriberReady = false;

function getRedisUrl() {
  return process.env.REDIS_URL || null;
}

function getPublisher() {
  if (publisher !== undefined) return publisher;
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    publisher = null;
    return publisher;
  }

  try {
    publisher = new IORedis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    publisher.on('error', () => {});
  } catch (_error) {
    publisher = null;
  }

  return publisher;
}

async function ensureSubscriber() {
  if (subscriberReady) return;

  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    subscriberReady = true;
    return;
  }

  if (!subscriber) {
    try {
      subscriber = new IORedis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      subscriber.on('error', () => {});
      subscriber.on('message', (_channel, message) => {
        try {
          const payload = JSON.parse(message);
          if (payload?.jobId) {
            localEmitter.emit(String(payload.jobId), payload);
          }
        } catch (_error) {}
      });
    } catch (_error) {
      subscriber = null;
    }
  }

  if (subscriber) {
    try {
      await subscriber.subscribe(CHANNEL);
    } catch (_error) {}
  }

  subscriberReady = true;
}

async function publishJobEvent(payload) {
  if (!payload || !payload.jobId) return;

  const normalizedPayload = {
    ...payload,
    jobId: String(payload.jobId),
    publishedAt: new Date().toISOString(),
  };

  localEmitter.emit(normalizedPayload.jobId, normalizedPayload);

  const redisPublisher = getPublisher();
  if (!redisPublisher) return;

  try {
    await redisPublisher.publish(CHANNEL, JSON.stringify(normalizedPayload));
  } catch (_error) {}
}

async function subscribeToJobEvents(jobId, listener) {
  const normalizedJobId = String(jobId);
  await ensureSubscriber();
  localEmitter.on(normalizedJobId, listener);
  return () => localEmitter.off(normalizedJobId, listener);
}

module.exports = {
  publishJobEvent,
  subscribeToJobEvents,
};
