'use strict';
const { Developer } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'developer-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Developer, req, key, { 
        defaultAttributes: ["*","logo"],
        where: { id },
        fileFields: ["logo"],
     });
    if (!data) {
        throw new Error('Error fetching developer', 400);
    }
    return { data, name };
};
