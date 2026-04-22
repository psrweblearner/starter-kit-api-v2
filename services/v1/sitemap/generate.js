'use strict';

const sitemapQueue = require('../../../utils/queue/sitemap.queue');
const { Job } = require('../../../models');
const AppError = require('../../../utils/AppError');
const { normalizeDomain } = require('../../../utils/domain');

const JOB_ATTEMPTS = Number(process.env.BULLMQ_JOB_ATTEMPTS || 2);
const JOB_BACKOFF_DELAY_MS = Number(process.env.BULLMQ_BACKOFF_DELAY_MS || 5000);

module.exports = async (req) => {
  const {
    domain,
    includeImages = false,
    includeVideos = false,
    maxUrls,
    maxDepth,
    concurrency,
  } = req.body;

  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain) {
    throw new AppError('Invalid domain. Use a valid hostname like example.com', 400);
  }

  const dbJob = await Job.create({
    type: 'sitemap',
    status: 'pending',
    inputData: {
      domain: cleanDomain,
      includeImages: Boolean(includeImages),
      includeVideos: Boolean(includeVideos),
      maxUrls: typeof maxUrls === 'number' ? maxUrls : undefined,
      maxDepth: typeof maxDepth === 'number' ? maxDepth : undefined,
      concurrency: typeof concurrency === 'number' ? concurrency : undefined,
    },
    userId: req?.user?.id || null,
  });

  await sitemapQueue.add(
    'job',
    {
      jobId: String(dbJob.id),
      type: 'sitemap',
    },
    {
      jobId: `sitemap_job_${dbJob.id}`,
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
