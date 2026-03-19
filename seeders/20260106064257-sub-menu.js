'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const pages = [
      { title: 'Activity Logs', icon: 'fa-solid fa-chart-line', slug: 'activity-logs', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Admin Users', icon: 'fa-solid fa-user-group', slug: 'admin-users', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Roles', icon: 'fa-solid fa-id-badge', slug: 'roles', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Permissions', icon: 'fa-solid fa-key', slug: 'permissions', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Module', icon: 'fa-solid fa-file', slug: 'module', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Feature', icon: 'fa-solid fa-file-alt', slug: 'feature', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'File Manager', icon: 'fa-solid fa-image', slug: 'file-manager', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Menu Builder', icon: 'fa-solid fa-box', slug: 'menu-builder', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'General Settings', icon: 'fa-solid fa-cog', slug: 'settings', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'File Picker', icon: 'fa-solid fa-crosshairs', slug: 'file-picker', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Email Template', icon: 'fa-solid fa-inbox', slug: 'email-templates', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Lead', icon: 'fa-solid fa-database', slug: 'leads', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Entities', icon: 'fa-solid fa-database', slug: 'entities', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Entity Field', icon: 'fa-solid fa-list', slug: 'entity-fields', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Lead Duplicate', icon: 'fa-solid fa-clone', slug: 'lead-duplicates', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Lead Follows', icon: 'fa-solid fa-comments', slug: 'lead-follows', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Pipelines', icon: 'fa-solid fa-filter', slug: 'pipelines', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Pipeline Stage', icon: 'fa-solid fa-layer-group', slug: 'pipeline-stages', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'CRM Reports', icon: 'fa-solid fa-chart-bar', slug: 'crm-reports', status: 1, createdBy: 1, modifyBy: 1 },
      { title: 'Mapping Fields', icon: 'fa-solid fa-link', slug: 'field-mappings', status: 1, createdBy: 1, modifyBy: 1 },
    ];

    // Fetch existing slugs
    const existing = await queryInterface.sequelize.query('SELECT slug FROM SubMenus;', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    const existingSlugs = new Set(existing.map(r => r.slug));

    // Prepare rows to insert
    const rowsToInsert = pages
      .filter(p => !existingSlugs.has(p.slug))
      .map(p => ({
        ...p,
        createdAt: now,
        updatedAt: now,
      }));

    if (rowsToInsert.length) {
      await queryInterface.bulkInsert('SubMenus', rowsToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubMenus', null, {});
  },
};
