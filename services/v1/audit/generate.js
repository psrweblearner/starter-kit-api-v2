'use strict';

const analyzeQueue = require('../../../utils/queue/analyze.queue');
const { Job } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeDomain } = require('../../../utils/domain');

const JOB_ATTEMPTS = Number(process.env.BULLMQ_JOB_ATTEMPTS || 2);
const JOB_BACKOFF_DELAY_MS = Number(process.env.BULLMQ_BACKOFF_DELAY_MS || 5000);

module.exports = async (req) => {
  const { domain, businessName, competitors = [], mode = 'mobile' } = req.body || {};

  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain) {
    throw new AppError('Invalid domain. Use a valid hostname like example.com', 400);
  }

  const cleanCompetitors = Array.isArray(competitors) ? competitors.map(normalizeDomain).filter(Boolean) : [];
  if (cleanCompetitors.length !== (Array.isArray(competitors) ? competitors.length : 0)) {
    throw new AppError('One or more competitor domains are invalid', 400);
  }

  const dbJob = await Job.create({
    type: 'audit',
    status: 'pending',
    inputData: {
      domain: cleanDomain,
      businessName: businessName ? String(businessName).trim() : null,
      competitors: cleanCompetitors,
      mode: mode === 'desktop' ? 'desktop' : 'mobile',
    },
    userId: req?.user?.id || null,
  });

  await analyzeQueue.add(
    'job',
    { jobId: String(dbJob.id), type: 'audit' },
    {
      jobId: `audit_job_${dbJob.id}`,
      attempts: JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: JOB_BACKOFF_DELAY_MS },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );

  return {
    jobId: String(dbJob.id),
    status: 'pending',
  };
};
