'use strict';
const { Gallery } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'gallery-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Gallery, req, key, {
        defaultAttributes: ["*", "file_id"],
        fileFields: ["file_id"],
        order: [["id", "DESC"]],
    });
    if (!data) {
        throw new Error('Error fetching categories', 400);
    }
    return { data, name };
};
