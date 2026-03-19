'use strict';
const { ApiClient } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'api-clients-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const { data, name } = await detailQuery(ApiClient, req, CacheKey + id, { defaultAttributes: ['*'], where: { id } });
    if (!data) {
        throw new Error('Error fetching API Client', 400);
    }
    return { data, name };
};
