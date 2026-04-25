'use strict';

const { detailQuery } = require('../../../utils/build_query');
const { UrlOpenerGroup } = require('../../../models');
const { getUserIdFromReq, serializeGroup } = require('./shared');
const CacheKey = 'url-opener-group-detail:';

module.exports = async (req) => {
  const userId = getUserIdFromReq(req);
  const id = Number(req.params.id);
  const key = `${CacheKey}${userId}:${id}`;

  const { data, name } = await detailQuery(UrlOpenerGroup, req, key, {
    defaultAttributes: ['id', 'name', 'urlsJson', 'created_at', 'updated_at'],
    where: { id, userId },
  });

  if (data?.data) {
    data.data = serializeGroup(data.data);
  }
  return { data, name };
};
