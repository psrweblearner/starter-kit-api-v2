'use strict';
const { AdminUserRole } = require('../../../models');
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

    let { roleId, adminUserId } = req.body;

    if (!adminUserId) {
        throw new AppError('Invalid input: adminUserId missing', 400);
    }

    if (!Array.isArray(roleId)) {
      if (roleId) {roleId = [roleId];} else {roleId = [];}
    }
    let accessData = {};

    if (Array.isArray(req.body.access)) {
    // access comes as array → map by roleId order
    roleId.forEach((rid, index) => {
        accessData[String(rid)] = req.body.access[index];
    });
    } else {
    // access comes as object (ideal case)
    accessData = req.body.access || {};
    }
    await AdminUserRole.destroy({ where: { adminUserId } });

    if (roleId.length) {
      const newAssignments = roleId.map(rid => {
        const assignment = {adminUserId,roleId: parseInt(rid, 10),access: accessData[rid] || "own"};
        return assignment;
      });
      await AdminUserRole.bulkCreate(newAssignments);
    }

    return { data: { status: true } };
};
