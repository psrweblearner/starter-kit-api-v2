'use strict';
const { AdminUser } = require('../../../models');
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

    const { id } = req.params;
    const adminUser = await AdminUser.findByPk(id);

    if (!adminUser) {
        throw new AppError('Admin User not found', 404);
    }

    await adminUser.update(req.body);

    return { data: { status: true, data: adminUser } };
};
