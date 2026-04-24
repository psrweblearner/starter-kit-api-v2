'use strict';

const pageSpeedQueue = require('../../../utils/queue/pagespeed.queue');
const { Job } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeDomain } = require('../../../utils/domain');

const JOB_ATTEMPTS = Number(process.env.BULLMQ_JOB_ATTEMPTS || 2);
const JOB_BACKOFF_DELAY_MS = Number(process.env.BULLMQ_BACKOFF_DELAY_MS || 5000);

module.exports = async (req) => {
  const { domain, mode } = req.body;
  const cleanDomain = normalizeDomain(domain);
  const strategy = mode === 'desktop' ? 'desktop' : 'mobile';
  if (!cleanDomain) {
    throw new AppError('Invalid domain. Use a valid hostname like example.com', 400);
  }

  const dbJob = await Job.create({
    type: 'speed',
    status: 'pending',
    inputData: {
      domain: cleanDomain,
      mode: strategy,
    },
    userId: req?.user?.id || null,
  });

  await pageSpeedQueue.add(
    'job',
    {
      jobId: String(dbJob.id),
      type: 'speed',
    },
    {
      jobId: `speed_job_${dbJob.id}`,
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
    jobId: String(dbJob.id),
    status: 'pending',
  };
};
