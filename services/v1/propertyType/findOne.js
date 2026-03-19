'use strict';
const { PropertyType } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'property-type-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(PropertyType, req, key, { 
        defaultAttributes: ["*","file_id"],
        where: { id },
        fileFields: ["file_id"],
     });
    if (!data) {
        throw new Error('Error fetching property type', 400);
    }
    return { data, name };
};
