'use strict';
const { Category } = require('../../../models');
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
    const categoryData = await Category.findByPk(id);

    if (!categoryData) {
        throw new AppError('Category not found', 404);
    }

    await categoryData.destroy();

    return { data: { status: true, message: 'Category deleted successfully' } };
};
