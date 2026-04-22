const catchAsync = require('../../utils/catchAsync');
const { getQueueStats } = require('../../utils/queue/connection');

exports.monitor = catchAsync(async (_req, res) => {
  const stats = await getQueueStats();
  res.json({
    success: true,
    data: stats,
  });
});
