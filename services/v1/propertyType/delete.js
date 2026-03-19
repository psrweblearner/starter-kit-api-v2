'use strict';
const { PropertyType } = require('../../../models');
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
    const pTypeData = await PropertyType.findByPk(id);

    if (!pTypeData) {
        throw new AppError('PropertyType not found', 404);
    }

    await pTypeData.destroy();

    return { data: { status: true, message: 'PropertyType deleted successfully' } };
};
