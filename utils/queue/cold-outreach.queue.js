'use strict';

const { Queue } = require('bullmq');
const { getQueueConnection } = require('./connection');

const COLD_OUTREACH_QUEUE_NAME = 'cold-outreach-jobs';

let queue;
function getColdOutreachQueue() {
  if (queue) return queue;
  queue = new Queue(COLD_OUTREACH_QUEUE_NAME, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: Number(process.env.COLD_OUTREACH_JOB_ATTEMPTS || 3),
      backoff: {
        type: 'exponential',
        delay: Number(process.env.COLD_OUTREACH_BACKOFF_MS || 3000),
      },
      removeOnComplete: 50,
      removeOnFail: 20,
    },
  });
  return queue;
}

module.exports = {
  COLD_OUTREACH_QUEUE_NAME,
  getColdOutreachQueue,
};
