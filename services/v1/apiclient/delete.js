'use strict';
const { ApiClient } = require('../../../models');
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
    const apiClient = await ApiClient.findByPk(id);

    if (!apiClient) {
        throw new AppError('API Client not found', 404);
    }

    await apiClient.destroy();

    return { data: { status: true, message: 'API Client deleted successfully' } };
};
