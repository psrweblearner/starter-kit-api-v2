'use strict';
const { EmailTemplate } = require('../../../models');
const { resolveConfig } = require('../../../utils/serviceHelper');
const AppError = require('../../../utils/AppError');
const normalizePayload = require('./normalizePayload');

const CONFIGS = {
    ADMIN: {}
};

module.exports = async (req) => {
    const config = resolveConfig(req, CONFIGS);

    if (config.platform !== 'ADMIN') {
        throw new AppError('Forbidden: Only admins can update records', 403);
    }

    const { id } = req.params;
    const emailTemplate = await EmailTemplate.findByPk(id);

    if (!emailTemplate) {
        throw new AppError('Email template not found', 404);
    }

    await emailTemplate.update(normalizePayload(req.body));

    return { data: { status: true, data: emailTemplate } };
};
