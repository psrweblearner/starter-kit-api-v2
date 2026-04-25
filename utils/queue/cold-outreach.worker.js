'use strict';

const { Worker } = require('bullmq');
const { COLD_OUTREACH_QUEUE_NAME } = require('./cold-outreach.queue');
const { getQueueConnection } = require('./connection');
const outreachService = require('../../services/v1/cold-outreach');

new Worker(
  COLD_OUTREACH_QUEUE_NAME,
  async (job) => {
    const type = String(job?.name || '');
    if (type === 'rule-fetch') {
      return outreachService.processRuleJob(job.data || {});
    }
    if (type === 'lead-scrape') {
      return outreachService.processScrapeJob(job.data || {});
    }
    throw new Error(`Unsupported cold outreach job type: ${type}`);
  },
  {
    connection: getQueueConnection(),
    concurrency: Number(process.env.COLD_OUTREACH_WORKER_CONCURRENCY || 3),
  }
);
