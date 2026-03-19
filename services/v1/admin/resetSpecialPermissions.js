'use strict';
const { SpecialPermission } = require('../../../models');
const { resolveConfig } = require('../../../utils/serviceHelper');
const AppError = require('../../../utils/AppError');

const CONFIGS = {
    ADMIN: {}
};

module.exports = async (req) => {
    const config = resolveConfig(req, CONFIGS);

    if (config.platform !== 'ADMIN') {
        throw new AppError('Forbidden: Only admins can update records', 403);
    }

    let { adminUserId } = req.body;

    if (!adminUserId) {
        throw new AppError('Invalid input: adminUserId missing', 400);
    }

    await SpecialPermission.destroy({ where: { adminUserId } });
    

    return { data: { status: true } };
};
