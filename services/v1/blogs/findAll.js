'use strict';
const { Blog } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'blogs-list:'
module.exports = async (req) => {
    const { data, name } = await listQuery(Blog, req, CacheKey, {
        defaultAttributes: ['*', 'file_id'],
        fileFields: ["file_id"],
    });
    if (!data) {
        throw new Error('Error fetching blogs', 400);
    }
    return { data, name };
};
