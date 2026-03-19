'use strict';
const { SpecialPermission } = require('../../../models');
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

    let { adminUserId, roleId, pageId, actions } = req.body;

    if (!adminUserId || !roleId || !pageId || !Array.isArray(actions)) {
        throw new AppError('Invalid input: adminUserId, roleId, pageId or actions missing', 400);
    }

   const existing = await SpecialPermission.findOne({
      where: { adminUserId, roleId, pageId },
    });
    if (actions.length === 0) {
      // remove record if no permissions left
      if (existing) await existing.destroy();
    } else if (existing) {
      await existing.update({ actions });
    } else {
      await SpecialPermission.create({ adminUserId, roleId, pageId, actions });
    }

    return { data: { status: true } };
};
