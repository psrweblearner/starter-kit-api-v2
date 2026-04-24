'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('jobs', 'type', {
      type: Sequelize.ENUM('sitemap', 'competitor', 'speed', 'qr', 'sitemap_automation', 'audit'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('jobs', 'type', {
      type: Sequelize.ENUM('sitemap', 'competitor', 'speed', 'qr', 'sitemap_automation'),
      allowNull: false,
    });
  },
};
