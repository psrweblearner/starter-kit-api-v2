const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');
const { getSnapshot, clearSnapshot } = require('../../utils/jobSnapshot');

exports.generate = catchAsync(async (req, res) => {
  const data = await services.qr.generate(req);
  res.status(200).json({
    success: true,
    message: 'QR generation job created successfully',
    data,
  });
});

exports.getResult = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const snapshot = await getSnapshot(jobId);
  return res.json({
    ...snapshot,
    qrImageUrl: snapshot.data?.qrImageUrl || null,
  });
});

exports.clearResultCache = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  await clearSnapshot(jobId);
  return res.json({
    success: true,
    message: 'QR result snapshot cache cleared',
    data: { jobId: String(jobId) },
  });
});
