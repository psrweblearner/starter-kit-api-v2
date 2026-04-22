'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.ENUM('sitemap', 'competitor', 'speed', 'qr'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      input_data: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      result_data: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('jobs', ['status']);
    await queryInterface.addIndex('jobs', ['type']);
    await queryInterface.addIndex('jobs', ['user_id']);
    await queryInterface.addIndex('jobs', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jobs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jobs_type";').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jobs_status";').catch(() => {});
  },
};
