'use strict';
const { Role } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'roles-list:'
module.exports = async (req) => {
    const { data, name } = await listQuery(Role, req, CacheKey, { defaultAttributes: ["id","title","status","createdAt","updatedAt","createdBY"],
      defaultSort: [["id", "DESC"]] });
    if (!data) {
        throw new Error('Error fetching roles', 400);
    }
    return { data, name };
};
