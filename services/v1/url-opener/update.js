'use strict';

const { getUserIdFromReq, getOwnedGroupOrThrow, normalizeUrls, serializeGroup } = require('./shared');
const AppError = require('../../../utils/AppError');

module.exports = async (req) => {
  const userId = getUserIdFromReq(req);
  const group = await getOwnedGroupOrThrow(req.params.id, userId);

  const name = req.body?.name === undefined ? group.name : String(req.body.name || '').trim();
  const urls = req.body?.urls === undefined ? null : normalizeUrls(req.body.urls);

  if (!name) throw new AppError('Group name is required', 400);
  if (urls && !urls.length) throw new AppError('At least one valid URL is required', 400);

  await group.update({
    name,
    urlsJson: urls ? JSON.stringify(urls) : group.urlsJson,
  });

  return serializeGroup(group);
};
