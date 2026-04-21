'use strict';
const { User } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'users-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(User, req, key, {
        defaultAttributes: ["*"],
        order: [["id", "DESC"]],
    });

    if (!data) {
        throw new Error('Error fetching users', 400);
    }
    return { data, name };
};
