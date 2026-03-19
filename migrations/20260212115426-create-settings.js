'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      status: {
        type: Sequelize.TINYINT, // 1 = active, 0 = inactive
        allowNull: false,
        defaultValue: 1
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      modifyBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Settings');
  }
};
