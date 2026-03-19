'use strict';
const { Faq } = require('../../../models');
module.exports = async (req) => {
    const { question, ans, status, sort_order, category, is_global } = req.body;
    const user = req.user?.id || 'system';
    const faq = await Faq.create({
        question,
        ans,
        status,
        sort_order,
        category,
        is_global,
        createdBy: user
    });

    return { data: faq };
};
