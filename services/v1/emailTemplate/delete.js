'use strict';
const { EmailTemplate } = require('../../../models');
const { resolveConfig } = require('../../../utils/serviceHelper');
const AppError = require('../../../utils/AppError');

const CONFIGS = {
    ADMIN: {}
};

module.exports = async (req) => {
    const config = resolveConfig(req, CONFIGS);
    if (config.platform !== 'ADMIN') {
        throw new AppError('Forbidden: Only admins can delete records', 403);
    }

    const { id } = req.params;
    const emaildata = await EmailTemplate.findByPk(id);

    if (!emaildata) {
        throw new AppError('Email template not found', 404);
    }

    await emaildata.destroy();

    return { data: { status: true, message: 'Email template deleted successfully' } };
};
