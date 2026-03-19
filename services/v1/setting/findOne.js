'use strict';
const { Setting } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'settings-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Setting, req, key, {
        defaultAttributes: ["*"],
        where: { id },
    });
    if (!data) {
        throw new Error('Error fetching setting', 400);
    }
    return { data, name };
};
