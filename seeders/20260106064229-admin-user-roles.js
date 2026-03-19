'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const desired = [
      // Super Admin (user 1) → has Admin + Manager + Editor
      { adminUserId: 1, roleId: 1,access:"full" },
    ];

    const existing = await queryInterface.sequelize.query('SELECT adminUserId, roleId FROM AdminUserRoles;', { type: queryInterface.sequelize.QueryTypes.SELECT });
    const have = new Set(existing.map(r => `${r.adminUserId}:${r.roleId}`));
    const toInsert = desired
      .filter(r => !have.has(`${r.adminUserId}:${r.roleId}`))
      .map(r => ({ ...r, createdAt: now, updatedAt: now }));
    if (toInsert.length) {
      await queryInterface.bulkInsert('AdminUserRoles', toInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AdminUserRoles', null, {});
  }
};
