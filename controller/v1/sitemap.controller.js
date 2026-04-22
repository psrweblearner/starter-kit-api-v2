const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');
const { Job } = require('../../models');
const { getSnapshot, clearSnapshot } = require('../../utils/jobSnapshot');
const sitemapLive = require('../../utils/sitemapLive');
const AppError = require('../../utils/AppError');

exports.generate = catchAsync(async (req, res) => {
  const data = await services.sitemap.generate(req);
  res.status(200).json({
    success: true,
    message: 'Sitemap generation job created successfully',
    data,
  });
});

exports.getResult = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const snapshot = await getSnapshot(jobId);
  const liveCount = snapshot.live?.urlsInSitemap;
  return res.json({
    ...snapshot,
    totalUrls: snapshot.data?.totalUrls ?? liveCount ?? 0,
    sitemapUrl: snapshot.data?.sitemapUrl || null,
  });
});

exports.clearResultCache = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  await clearSnapshot(jobId);
  return res.json({
    success: true,
    message: 'Sitemap result snapshot cache cleared',
    data: { jobId: String(jobId) },
  });
});

exports.stop = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const normalizedJobId = String(jobId);
  const jobRecord = await Job.findByPk(normalizedJobId);
  if (!jobRecord || jobRecord.type !== 'sitemap') {
    throw new AppError('Sitemap job not found', 404);
  }
  if (jobRecord.status !== 'processing' && jobRecord.status !== 'pending') {
    throw new AppError('Sitemap job is not running', 400);
  }
  await sitemapLive.requestStop(normalizedJobId);
  return res.status(200).json({
    success: true,
    message: 'Stop requested. The crawler will finish the current batch and save the sitemap with URLs collected so far.',
    data: { jobId: normalizedJobId },
  });
});
