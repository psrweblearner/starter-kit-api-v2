'use strict';
const { EmailTemplate } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'email-template-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(EmailTemplate, req, key, { 
        defaultAttributes: ["*"],
        where: { id },
     });
    if (!data) {
        throw new Error('Error fetching email template', 400);
    }
    return { data, name };
};
