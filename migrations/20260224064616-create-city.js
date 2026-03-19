'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      name: {
        type: Sequelize.STRING,
        allowNull: true
      },

      file_id: {
        type: Sequelize.STRING,
        allowNull: true
      },

      slug: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },

      tagline: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      country: {
        type: Sequelize.STRING,
        allowNull: true
      },

      state: {
        type: Sequelize.STRING,
        allowNull: true
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0'
      },

      is_prominent: {
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

    // 🔹 Indexes for performance
    await queryInterface.addIndex('cities', ['slug']);
    await queryInterface.addIndex('cities', ['status']);
    await queryInterface.addIndex('cities', ['country']);
    await queryInterface.addIndex('cities', ['state']);
    await queryInterface.addIndex('cities', ['is_prominent']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cities');
  }
};