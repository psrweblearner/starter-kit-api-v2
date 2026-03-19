'use strict';
const { Faq } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'faq-list:';
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Faq, req, key, {
        defaultAttributes: ["*"],
        where: { id },
    });
    if (!data) {
        throw new Error('Error fetching FAQ', 400);
    }
    return { data, name };
};
