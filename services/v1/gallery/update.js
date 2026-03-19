'use strict';
const { Gallery } = require('../../../models');
const AppError = require('../../../utils/AppError');

module.exports = async (req) => {
    const { id } = req.params;
    const updateData = req.body;

    const gallery = await Gallery.findByPk(id);
    if (!gallery) {
        throw new AppError('Gallery item not found', 404);
    }

    await gallery.update(updateData);

    return { data: gallery };
};
