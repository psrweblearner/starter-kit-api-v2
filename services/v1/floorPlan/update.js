'use strict';
const { Floorplan } = require('../../../models');
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
    const floorplan = await Floorplan.findByPk(id);

    if (!floorplan) {
        throw new AppError('Floor Plan not found', 404);
    }

    await floorplan.update(req.body);

    return { data: { status: true, data: floorplan } };
};
