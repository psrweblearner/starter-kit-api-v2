'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('automation_sites', 'publish_endpoint', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('automation_sites', 'publish_secret', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('automation_sites', 'publish_path', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: 'public/sitemap.xml',
    });
    await queryInterface.addColumn('automation_sites', 'last_ping_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('automation_sites', 'verified_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('automation_sites', 'last_publish_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('automation_sites', 'last_publish_status', {
      type: Sequelize.ENUM('pending', 'success', 'failed', 'not-configured'),
      allowNull: false,
      defaultValue: 'not-configured',
    });
    await queryInterface.addColumn('automation_sites', 'last_publish_message', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('automation_sites', 'last_publish_message');
    await queryInterface.removeColumn('automation_sites', 'last_publish_status');
    await queryInterface.removeColumn('automation_sites', 'last_publish_at');
    await queryInterface.removeColumn('automation_sites', 'verified_at');
    await queryInterface.removeColumn('automation_sites', 'last_ping_at');
    await queryInterface.removeColumn('automation_sites', 'publish_path');
    await queryInterface.removeColumn('automation_sites', 'publish_secret');
    await queryInterface.removeColumn('automation_sites', 'publish_endpoint');
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_automation_sites_last_publish_status";')
      .catch(() => {});
  },
};
