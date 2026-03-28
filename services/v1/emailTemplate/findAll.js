'use strict';
const { EmailTemplate } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'email-template-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(EmailTemplate, req, key, { 
        defaultAttributes: ["*"],
        order: [["id", "DESC"]], });
    if (!data) {
        throw new Error('Error fetching email templates', 400);
    }
    return { data, name };
};
