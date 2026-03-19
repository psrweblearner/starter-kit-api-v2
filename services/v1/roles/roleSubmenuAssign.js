'use strict';
const { Permission } = require('../../../models');
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
    let { payload } = req.body;
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new AppError("Payload is required", 400);
    }
    const roleId = payload[0].roleId;
    await Permission.destroy({where: { roleId }});
    const bulkData = payload.map(item => ({roleId: item.roleId,pageId: item.pageId,actions: item.actions}));
    await Permission.bulkCreate(bulkData);
};
