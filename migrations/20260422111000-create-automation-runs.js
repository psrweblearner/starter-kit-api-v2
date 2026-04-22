'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('automation_runs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      site_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'automation_sites',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      job_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      trigger_type: {
        type: Sequelize.ENUM('manual', 'cron'),
        allowNull: false,
        defaultValue: 'manual',
      },
      status: {
        type: Sequelize.ENUM('queued', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'queued',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finished_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      discovered_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failed_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      external_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sitemap_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      index_submitted_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      index_failed_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      error_summary: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      result_data: {
        type: Sequelize.TEXT('long'),
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

    await queryInterface.addIndex('automation_runs', ['site_id']);
    await queryInterface.addIndex('automation_runs', ['user_id']);
    await queryInterface.addIndex('automation_runs', ['status']);
    await queryInterface.addIndex('automation_runs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('automation_runs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_automation_runs_trigger_type";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_automation_runs_status";').catch(() => {});
  },
};
