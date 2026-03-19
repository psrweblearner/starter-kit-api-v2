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
        throw new AppError('Forbidden: Only admins can delete records', 403);
    }

    const { id } = req.params;
    const amenity = await Amenity.findByPk(id);

    if (!amenity) {
        throw new AppError('Amenity not found', 404);
    }

    await amenity.destroy();

    return { data: { status: true, message: 'Amenity deleted successfully' } };
};
