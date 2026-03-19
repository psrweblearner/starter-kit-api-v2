'use strict';
const { Amenity } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'amenities-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Amenity, req, key, {
        defaultAttributes: ["*"],
        order: [["id", "DESC"]],
    });

    if (!data) {
        throw new Error('Error fetching amenities', 400);
    }
    return { data, name };
};
