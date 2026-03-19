'use strict';
const { Setting } = require('../../../models');
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
    const settingData = await Setting.findByPk(id);

    if (!settingData) {
        throw new AppError('Setting not found', 404);
    }

    await settingData.destroy();

    return { data: { status: true, message: 'Setting deleted successfully' } };
};
