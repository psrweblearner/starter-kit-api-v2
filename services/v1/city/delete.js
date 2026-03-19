'use strict';
const { City } = require('../../../models');
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
    const city = await City.findByPk(id);

    if (!city) {
        throw new AppError('City not found', 404);
    }

    await city.destroy();

    return { data: { status: true, message: 'City deleted successfully' } };
};
