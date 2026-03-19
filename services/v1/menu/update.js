'use strict';
const { Menu } = require('../../../models');
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
    const menu = await Menu.findByPk(id);

    if (!menu) {
        throw new AppError('Menu not found', 404);
    }

    await menu.update(req.body);

    return { data: { status: true, data: menu } };
};
