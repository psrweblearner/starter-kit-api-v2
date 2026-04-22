'use strict';

const { Job, AutomationRun } = require('../../../models');
const sitemapQueue = require('../../../utils/queue/sitemap.queue');

const JOB_ATTEMPTS = Number(process.env.BULLMQ_JOB_ATTEMPTS || 2);
const JOB_BACKOFF_DELAY_MS = Number(process.env.BULLMQ_BACKOFF_DELAY_MS || 5000);

async function enqueueAutomationRun(site, options = {}) {
  const triggerType = options.triggerType === 'cron' ? 'cron' : 'manual';

  const run = await AutomationRun.create({
    siteId: Number(site.id),
    userId: Number(site.userId),
    triggerType,
    status: 'queued',
  });

  const dbJob = await Job.create({
    type: 'sitemap_automation',
    status: 'pending',
    inputData: {
      runId: Number(run.id),
      siteId: Number(site.id),
      domain: String(site.domain),
      includeImages: true,
      includeVideos: true,
      googleIndexEnabled: Boolean(site.googleIndexEnabled),
      googleProperty: site.googleProperty || null,
      indexApiConfigRef: site.indexApiConfigRef || null,
    },
    userId: Number(site.userId),
  });

  await run.update({ jobId: Number(dbJob.id) });

  await sitemapQueue.add(
    'job',
    {
      jobId: String(dbJob.id),
      type: 'sitemap_automation',
    },
    {
      jobId: `sitemap_automation_job_${dbJob.id}`,
      attempts: JOB_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF_DELAY_MS,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  return {
    runId: Number(run.id),
    jobId: Number(dbJob.id),
    status: 'queued',
    triggerType,
  };
}

module.exports = {
  enqueueAutomationRun,
};
