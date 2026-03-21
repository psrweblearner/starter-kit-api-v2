'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EmailTemplates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false
      },
      operation: {
        type: Sequelize.ENUM('create', 'update', 'delete', 'download'),
        allowNull: true
      },
      attchment: {
        type: Sequelize.STRING,
        allowNull: true
      },
      attchmentTo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userSubject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      adminSubject: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userBody: {
        type: Sequelize.TEXT('long'),
        allowNull: false
      },
      adminBody: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      mailTo: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'all'
      },
      mail: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '1'
      },
      mailField: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '1'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      modifiedBy: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('EmailTemplates', ['module', 'operation', 'status']);
    await queryInterface.addIndex('EmailTemplates', ['createdBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('EmailTemplates');
  }
};
