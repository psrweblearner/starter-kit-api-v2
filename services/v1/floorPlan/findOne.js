'use strict';
const { Floorplan } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'floor-plan-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Floorplan, req, key, { 
        defaultAttributes: ["*","file_id"],
        where: { id },
        fileFields: ["file_id"],
     });
    if (!data) {
        throw new Error('Error fetching floor plan', 400);
    }
    return { data, name };
};
