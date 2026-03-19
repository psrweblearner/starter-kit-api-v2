'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Build desired permissions using page slugs, then resolve to pageId
    const base = [
      { roleId: 1, pageSlug: 'admin-users', actions: ['create', 'read', 'update', 'delete'] },
    ];
    
    const extra = [
      { roleId: 1, pageSlug: 'roles', actions: ['create', 'read'] },
    ];
    

    const desired = [...base, ...extra];

    const pages = await queryInterface.sequelize.query('SELECT id, slug FROM SubMenus;', { type: queryInterface.sequelize.QueryTypes.SELECT });
    const pageIdBySlug = Object.fromEntries(pages.map(p => [p.slug, p.id]));

    const existing = await queryInterface.sequelize.query('SELECT roleId, pageId FROM Permissions;', { type: queryInterface.sequelize.QueryTypes.SELECT });
    const have = new Set(existing.map(r => `${r.roleId}:${r.pageId}`));
    const now = new Date();

    const toInsert = desired
      .map(p => ({ ...p, pageId: pageIdBySlug[p.pageSlug] || null }))
      .filter(p => p.pageId && !have.has(`${p.roleId}:${p.pageId}`))
      .map(p => ({
        roleId: p.roleId,
        pageId: p.pageId,
        actions:JSON.stringify(p.actions || []),
        createdAt: now,
        updatedAt: now,
      }));

    if (toInsert.length) {
      await queryInterface.bulkInsert('Permissions', toInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove only those we added
    await queryInterface.bulkDelete('Permissions', null, {});
  }
};