'use strict';
const { Role } = require('../../../models');
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
    const roleData = await Role.findByPk(id);

    if (!roleData) {
        throw new AppError('Role not found', 404);
    }

    await roleData.destroy();

    return { data: { status: true, message: 'Role deleted successfully' } };
};
