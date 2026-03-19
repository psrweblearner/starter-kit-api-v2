'use strict';
const { Tag } = require('../../../models');
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
    const tagData = await Tag.findByPk(id);

    if (!tagData) {
        throw new AppError('Tag not found', 404);
    }

    await tagData.destroy();

    return { data: { status: true, message: 'Tag deleted successfully' } };
};
