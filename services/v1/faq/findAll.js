'use strict';
const { Faq } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'faq-list:';
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Faq, req, key, {
        defaultAttributes: ["*"],
        order: [["sort_order", "ASC"], ["id", "DESC"]],
    });
    if (!data) {
        throw new Error('Error fetching FAQs', 400);
    }
    return { data, name };
};
