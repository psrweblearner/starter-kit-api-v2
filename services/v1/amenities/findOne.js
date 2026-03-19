'use strict';
const { Amenity } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'amenities-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Amenity, req, key, { 
        defaultAttributes: ["*"],
        where: { id },
     });
    if (!data) {
        throw new Error('Error fetching amenity', 400);
    }
    return { data, name };
};
