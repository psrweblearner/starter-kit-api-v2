'use strict';
const { Tag } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'tags-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Tag, req, key, {
        defaultAttributes: ["id", "name", "slug", "description", "color", "usage_count", "status", "createdBy", "createdAt"],
        order: [["usage_count", "DESC"], ["name", "ASC"]],
    });
    if (!data) {
        throw new Error('Error fetching tags', 400);
    }
    return { data, name };
};
