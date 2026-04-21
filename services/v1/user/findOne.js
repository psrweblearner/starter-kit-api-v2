'use strict';
const { User } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'users-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(User, req, key, { 
        defaultAttributes: ["*"],
        where: { id },
     });
    if (!data) {
        throw new Error('Error fetching user', 400);
    }
    return { data, name };
};
