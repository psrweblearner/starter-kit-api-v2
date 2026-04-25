'use strict';

const { getUserIdFromReq, getOwnedGroupOrThrow } = require('./shared');

module.exports = async (req) => {
  const userId = getUserIdFromReq(req);
  const group = await getOwnedGroupOrThrow(req.params.id, userId);
  await group.destroy();
  return {
    id: Number(group.id),
    deleted: true,
  };
};
