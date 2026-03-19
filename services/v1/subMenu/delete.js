'use strict';
const { SubMenu } = require('../../../models');
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
    const subMenu = await SubMenu.findByPk(id);

    if (!subMenu) {
        throw new AppError('SubMenu not found', 404);
    }

    await subMenu.destroy();

    return { data: { status: true, message: 'SubMenu deleted successfully' } };
};
