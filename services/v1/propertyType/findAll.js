'use strict';
const { PropertyType } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'property-type-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(PropertyType, req, key, { 
        defaultAttributes: ["*","file_id"],
        fileFields: ["file_id"],
        order: [["id", "DESC"]], });
    if (!data) {
        throw new Error('Error fetching property types', 400);
    }
    return { data, name };
};
