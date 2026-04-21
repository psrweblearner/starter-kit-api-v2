const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');
const reportStore = require('../../temp/report.store');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const queueConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
const analyzeQueue = new Queue('analyze-queue', {
  connection: queueConnection,
});

exports.analyze = catchAsync(async (req, res) => {
  const data = await services.competitor.analyze(req);
  res.status(200).json({
    success: true,
    message: 'Competitor analysis job created successfully',
    data,
  });
});


exports.getResult = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const data = await reportStore.get(jobId);

  if (!data) {
    const job = await analyzeQueue.getJob(jobId);
    if (job) {
      const state = await job.getState();

      if (state === 'failed') {
        return res.json({
          status: 'failed',
          error: job.failedReason || 'Job failed',
        });
      }

      if (state === 'completed') {
        return res.json({
          status: 'completed',
          data: job.returnvalue || null,
        });
      }
    }

    return res.json({
      status: 'processing'
    });
  }

  res.json({
    status: 'completed',
    data
  });
});