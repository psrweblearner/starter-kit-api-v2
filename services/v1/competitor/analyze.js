'use strict';
const analyzeQueue = require('../../../utils/queue/analyze.queue');
const { Job } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeDomain } = require('../../../utils/domain');

const JOB_ATTEMPTS = Number(process.env.BULLMQ_JOB_ATTEMPTS || 2);
const JOB_BACKOFF_DELAY_MS = Number(process.env.BULLMQ_BACKOFF_DELAY_MS || 5000);

module.exports = async (req) => {
  const { domain, competitors, businessName } = req.body;

  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain) {
    throw new AppError('Invalid domain. Use a valid hostname like example.com', 400);
  }

  const cleanCompetitors = competitors.map(normalizeDomain).filter(Boolean);
  if (cleanCompetitors.length !== competitors.length) {
    throw new AppError('One or more competitor domains are invalid', 400);
  }
  const dbJob = await Job.create({
    type: 'competitor',
    status: 'pending',
    inputData: {
      domain: cleanDomain,
      competitors: cleanCompetitors,
      businessName: businessName ? String(businessName).trim() : null,
    },
    userId: req?.user?.id || null,
  });

  await analyzeQueue.add(
    'job',
    {
      jobId: String(dbJob.id),
      type: 'competitor',
    },
    {
      jobId: `competitor_job_${dbJob.id}`,
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
