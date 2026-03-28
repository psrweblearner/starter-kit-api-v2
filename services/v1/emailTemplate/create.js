// services/v1/emailTemplate/create.js
'use strict';
const { EmailTemplate } = require('../../../models');
const normalizePayload = require('./normalizePayload');
module.exports = async (req) => {
    const payload = normalizePayload(req.body);
    const user = req.user?.id || 'system';
    await EmailTemplate.create({ ...payload, createdBy:user});
    return;
};
