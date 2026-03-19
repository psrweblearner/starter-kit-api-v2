'use strict';
const { Setting } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'settings-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Setting, req, key, {
        defaultAttributes: ["*"],
        order: [["id", "DESC"]],
    });
    if (!data) {
        throw new Error('Error fetching settings', 400);
    }
    return { data, name };
};
