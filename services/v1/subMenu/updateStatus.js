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
        throw new AppError('Forbidden: Only admins can update records', 403);
    }

    const { id } = req.params;
    const subMenuData = await SubMenu.findByPk(id);

    if (!subMenuData) {
        throw new AppError('SubMenu not found', 404);
    }

    await subMenuData.update(req.body);

    return { data: { status: true, data: subMenuData } };
};
