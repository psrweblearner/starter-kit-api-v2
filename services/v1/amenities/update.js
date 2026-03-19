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
    const amenity = await Amenity.findByPk(id);

    if (!amenity) {
        throw new AppError('Amenity not found', 404);
    }

    await amenity.update(req.body);

    return { data: { status: true, data: amenity } };
};
