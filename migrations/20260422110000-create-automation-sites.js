'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('automation_sites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      is_connected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verification_token: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      verify_script_installed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verify_sitemap_reachable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      schema_markup_text: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      schema_applied_status: {
        type: Sequelize.ENUM('not_applied', 'applied', 'failed'),
        allowNull: false,
        defaultValue: 'not_applied',
      },
      cron_expression: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      last_run_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      next_run_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      google_index_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      google_property: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      index_api_config_ref: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('automation_sites', {
      fields: ['user_id', 'domain'],
      type: 'unique',
      name: 'uq_automation_sites_user_domain',
    });
    await queryInterface.addIndex('automation_sites', ['user_id']);
    await queryInterface.addIndex('automation_sites', ['next_run_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('automation_sites');
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_automation_sites_schema_applied_status";')
      .catch(() => {});
  },
};
