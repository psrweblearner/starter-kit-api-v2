'use strict';

const qrQueue = require('../../../utils/queue/qr.queue');
const { Job } = require('../../../models');

const JOB_ATTEMPTS = Number(process.env.BULLMQ_JOB_ATTEMPTS || 2);
const JOB_BACKOFF_DELAY_MS = Number(process.env.BULLMQ_BACKOFF_DELAY_MS || 5000);

module.exports = async (req) => {
  const {
    content,
    width = 600,
    darkColor = '#000000',
    lightColor = '#ffffff',
    margin = 1,
    fileName = 'qr-code',
  } = req.body;

  const cleanContent = String(content || '').trim();
  const cleanFileName = sanitizeFileName(fileName);

  const dbJob = await Job.create({
    type: 'qr',
    status: 'pending',
    inputData: {
      content: cleanContent,
      width: Number(width) || 600,
      darkColor: String(darkColor || '#000000'),
      lightColor: String(lightColor || '#ffffff'),
      margin: Number(margin) || 1,
      fileName: cleanFileName,
    },
    userId: req?.user?.id || null,
  });

  await qrQueue.add(
    'job',
    {
      jobId: String(dbJob.id),
      type: 'qr',
    },
    {
      jobId: `qr_job_${dbJob.id}`,
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

function sanitizeFileName(input) {
  const value = String(input || 'qr-code').trim();
  const safe = value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return safe || 'qr-code';
}
