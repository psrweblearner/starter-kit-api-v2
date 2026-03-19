'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Fetch all menus
    const menus = await queryInterface.sequelize.query(
      'SELECT id, slug FROM Menus;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Fetch all submenus
    const subMenus = await queryInterface.sequelize.query(
      'SELECT id, slug FROM SubMenus;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Build lookup maps
    const menuIdBySlug = Object.fromEntries(menus.map(m => [m.slug, m.id]));
    const subMenuIdBySlug = Object.fromEntries(subMenus.map(s => [s.slug, s.id]));

    // Define relations
    const relations = [
      {
        menu: 'users',
        pages: [
          'admin-users',
          'roles',
          'permissions',
          'file-manager',
          'feature',
          'module',
          'file-picker',
        ]
      },
      {
        menu: 'configration', // Configuration menu
        pages: [
          'settings',           // General Settings
          'email-templates',
          'menu-builder',
        ]
      },
      {
        menu: 'crm',
        pages: [
          'leads',
          'entities',
          'entity-fields',
          'lead-duplicates',
          'lead-follows',
          'pipelines',
          'pipeline-stages',
          'crm-reports',
          'field-mappings'
        ]
      },
      {
        menu: 'developer',
        pages: [
          'activity-logs'
        ] // Add submenus if any later
      }
    ];

    // Prepare rows
    const rowsToInsert = [];
    for (const rel of relations) {
      const menuId = menuIdBySlug[rel.menu];
      if (!menuId) continue;

      for (const page of rel.pages) {
        const subMenuId = subMenuIdBySlug[page];
        if (!subMenuId) continue;

        rowsToInsert.push({
          menuId,
          subMenuId,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    if (rowsToInsert.length) {
      await queryInterface.bulkInsert('MenuSubMenus', rowsToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('MenuSubMenus', null, {});
  }
};
