'use strict';
const { Developer } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'developer-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Developer, req, key, { 
        defaultAttributes: ["*","logo"],
        fileFields: ["logo"],
        order: [["id", "DESC"]], });
    if (!data) {
        throw new Error('Error fetching developers', 400);
    }
    return { data, name };
};
