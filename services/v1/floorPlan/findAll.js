'use strict';
const { Floorplan } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'floor-plan-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Floorplan, req, key, { 
        defaultAttributes: ["*","file_id"],
        fileFields: ["file_id"],
        order: [["id", "DESC"]], });
    if (!data) {
        throw new Error('Error fetching floor plans', 400);
    }
    return { data, name };
};
