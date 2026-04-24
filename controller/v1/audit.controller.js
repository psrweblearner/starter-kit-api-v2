const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');
const { getSnapshot, clearSnapshot } = require('../../utils/jobSnapshot');
const { subscribeToJobEvents } = require('../../utils/queue/job-notification');

exports.run = catchAsync(async (req, res) => {
  const data = await services.audit.generate(req);
  res.status(200).json({
    success: true,
    message: 'Website audit job created successfully',
    data,
  });
});

exports.sectionNarratives = catchAsync(async (req, res) => {
  const data = await services.audit['section-narratives'](req);
  res.status(200).json({
    success: true,
    message: 'Section narratives generated',
    data,
  });
});

exports.getResult = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const snapshot = await getSnapshot(jobId);
  return res.json(snapshot);
});

exports.clearResultCache = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  await clearSnapshot(jobId);
  return res.json({
    success: true,
    message: 'Audit result snapshot cache cleared',
    data: { jobId: String(jobId) },
  });
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

  const firstSnapshot = await getSnapshot(jobId);
  sendEvent('snapshot', firstSnapshot);

  if (firstSnapshot.status !== 'processing' && firstSnapshot.status !== 'pending') {
    res.end();
    return;
  }

  const closeConnection = () => {
    if (!res.writableEnded) res.end();
  };

  const unsubscribe = await subscribeToJobEvents(jobId, async (eventPayload) => {
    const latest = await getSnapshot(jobId);
    sendEvent('job-update', {
      ...latest,
      event: eventPayload,
    });
    if (latest.status !== 'processing' && latest.status !== 'pending') {
      unsubscribe();
      closeConnection();
    }
  });

  const heartbeat = setInterval(async () => {
    if (res.writableEnded) return;
    const latest = await getSnapshot(jobId);
    if (latest.status !== 'processing' && latest.status !== 'pending') {
      sendEvent('job-update', latest);
      clearInterval(heartbeat);
      unsubscribe();
      closeConnection();
      return;
    }
    sendEvent('heartbeat', { ts: Date.now() });
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    closeConnection();
  });
});
