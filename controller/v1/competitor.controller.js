const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');
const reportStore = require('../../temp/report.store');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { subscribeToJobEvents } = require('../../utils/queue/job-notification');

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
  const snapshot = await resolveJobSnapshot(jobId);
  return res.json(snapshot);
});

exports.subscribeResult = catchAsync(async (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sendEvent = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  sendEvent('connected', {
    status: 'connected',
    jobId: String(jobId),
  });

  const firstSnapshot = await resolveJobSnapshot(jobId);
  sendEvent('snapshot', firstSnapshot);

  if (firstSnapshot.status !== 'processing') {
    res.end();
    return;
  }

  const closeConnection = () => {
    if (!res.writableEnded) res.end();
  };

  const unsubscribe = await subscribeToJobEvents(jobId, async (eventPayload) => {
    const latest = await resolveJobSnapshot(jobId);
    sendEvent('job-update', {
      ...latest,
      event: eventPayload,
    });
    if (latest.status !== 'processing') {
      unsubscribe();
      closeConnection();
    }
  });

  const heartbeat = setInterval(async () => {
    if (res.writableEnded) return;

    const latest = await resolveJobSnapshot(jobId);
    if (latest.status !== 'processing') {
      sendEvent('job-update', latest);
      clearInterval(heartbeat);
      unsubscribe();
      closeConnection();
      return;
    }

    sendEvent('heartbeat', {
      ts: Date.now(),
    });
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    closeConnection();
  });
});

async function resolveJobSnapshot(jobId) {
  const data = await reportStore.get(jobId);
  if (data) {
    return {
      status: 'completed',
      data,
    };
  }

  const job = await analyzeQueue.getJob(jobId);
  if (!job) {
    return {
      status: 'processing',
    };
  }

  const state = await job.getState();

  if (state === 'failed') {
    return {
      status: 'failed',
      error: job.failedReason || 'Job failed',
    };
  }

  if (state === 'completed') {
    return {
      status: 'completed',
      data: job.returnvalue || null,
    };
  }

  return {
    status: 'processing',
  };
}