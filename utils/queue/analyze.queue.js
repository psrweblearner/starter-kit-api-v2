'use strict';
require('dotenv').config({ override: process.env.NODE_ENV !== 'production' });

const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const analyzeQueue = new Queue('analyze-queue', {
  connection,
});

module.exports = analyzeQueue;