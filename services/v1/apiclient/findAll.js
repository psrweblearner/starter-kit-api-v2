'use strict';
const { ApiClient } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'api-clients-list:'
module.exports = async (req) => {
        // Generate dynamic cache key
        const queryPart = Object.keys(req.query).length ? ':' + JSON.stringify(req.query, Object.keys(req.query).sort()) : '';
        const dynamicKey = `${CacheKey}${queryPart}`;

        const { data, name } = await listQuery(ApiClient, req, dynamicKey, { defaultAttributes: ['*'] });
        if (!data) {
                throw new Error('Error fetching API Clients', 400);
        }
        return { data, name };
};
