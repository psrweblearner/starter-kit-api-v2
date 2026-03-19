'use strict';
const { Tag } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'tags-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Tag, req, key, {
        defaultAttributes: ["id", "name", "slug", "description", "color", "usage_count", "status", "createdBy", "createdAt", "updatedAt"],
        where: { id },
    });
    if (!data) {
        throw new Error('Error fetching tag', 400);
    }
    return { data, name };
};
