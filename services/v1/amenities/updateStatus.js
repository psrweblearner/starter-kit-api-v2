'use strict';
const { Amenity } = require('../../../models');
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
    const amenityData = await Amenity.findByPk(id);

    if (!amenityData) {
        throw new AppError('Amenity not found', 404);
    }

    await amenityData.update(req.body);

    return { data: { status: true, data: amenityData } };
};
