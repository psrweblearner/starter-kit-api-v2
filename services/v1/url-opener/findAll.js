'use strict';

const { UrlOpenerGroup } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const { getUserIdFromReq, serializeGroup } = require('./shared');
const CacheKey = 'url-opener-groups-list:';

module.exports = async (req) => {
  const userId = getUserIdFromReq(req);
  const key = `${CacheKey}${userId}:${JSON.stringify(req.query || {})}`;
  const { data, name } = await listQuery(UrlOpenerGroup, req, key, {
    defaultAttributes: ['id', 'name', 'urlsJson', 'created_at', 'updated_at'],
    where: { userId },
    order: [['created_at', 'DESC']],
  });
  if (data?.data) {
    data.data = data.data.map((row) => serializeGroup(row));
  }
  return { data, name };
};
