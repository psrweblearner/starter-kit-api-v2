'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EmailLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email_template_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'EmailTemplates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false
      },
      operation: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false
      },
      record_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      mail_triggered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'skipped'),
        defaultValue: 'pending'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('EmailLogs', ['email_template_id']);
    await queryInterface.addIndex('EmailLogs', ['module', 'operation', 'status']);
    await queryInterface.addIndex('EmailLogs', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('EmailLogs');
  }
};
