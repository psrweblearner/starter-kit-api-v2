'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('floorplans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tagline: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      property_id: {
        type: Sequelize.STRING,
        allowNull: true
      },

      bedroom: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '0'
      },

      bathroom: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '0'
      },

      amount: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '0'
      },

      area: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '0'
      },

      parking: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '0'
      },

      file_id: {
        type: Sequelize.STRING,
        allowNull: true
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0'
      },

      createdBy: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      },

      modifyBy: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
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

    // 🔹 Indexes
    await queryInterface.addIndex('floorplans', ['property_id']);
    await queryInterface.addIndex('floorplans', ['status']);
    await queryInterface.addIndex('floorplans', ['amount']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('floorplans');
  }
};