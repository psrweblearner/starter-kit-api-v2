'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const desired = [
    { title: 'Users', slug: 'users', icon: 'fa-solid fa-user-group', image: null, status: 1 },
    { title: 'Configuration', slug: 'settings', icon: 'fa-solid fa-cog', image: null, status: 1 },
    { title: 'CRM', slug: 'crm', icon: 'fa-solid fa-address-book', image: null, status: 1 },
    { title: 'System Configration', slug: 'configration', icon: 'fa-solid fa-sliders', image: null, status: 1 },
    { title: 'Developer', slug: 'developer', icon: 'fa-solid fa-code', image: null, status: 1 },
  ];

    const existing = await queryInterface.sequelize.query('SELECT slug FROM Menus;', { type: queryInterface.sequelize.QueryTypes.SELECT });
    const existingSlugs = new Set(existing.map(r => r.slug));
    const rowsToInsert = desired
      .filter(r => !existingSlugs.has(r.slug))
      .map(r => ({ ...r, createdBy: 'system', modifyBy: 'system', createdAt: now, updatedAt: now }));
    if (rowsToInsert.length) {
      await queryInterface.bulkInsert('Menus', rowsToInsert);
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Menus', null, {});
  }
};

