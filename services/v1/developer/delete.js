'use strict';
const { Developer } = require('../../../models');
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
    const developer = await Developer.findByPk(id);

    if (!developer) {
        throw new AppError('Developer not found', 404);
    }

    await developer.destroy();

    return { data: { status: true, message: 'Developer deleted successfully' } };
};
