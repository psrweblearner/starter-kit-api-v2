'use strict';
const { Gallery } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'gallery-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Gallery, req, key, {
        defaultAttributes: ["*", "file_id"],
        fileFields: ["file_id"],
        where: { id },
    });
    if (!data) {
        throw new Error('Error fetching gallery', 400);
    }
    return { data, name };
};
