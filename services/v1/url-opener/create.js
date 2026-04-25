'use strict';

const { UrlOpenerGroup } = require('../../../models');
const { getUserIdFromReq, normalizeUrls, serializeGroup } = require('./shared');
const AppError = require('../../../utils/AppError');

module.exports = async (req) => {
  const userId = getUserIdFromReq(req);
  const name = String(req.body?.name || '').trim();
  const urls = normalizeUrls(req.body?.urls || []);

  if (!name) throw new AppError('Group name is required', 400);
  if (!urls.length) throw new AppError('At least one valid URL is required', 400);

  const group = await UrlOpenerGroup.create({
    userId,
    name,
    urlsJson: JSON.stringify(urls),
  });

  return serializeGroup(group);
};
