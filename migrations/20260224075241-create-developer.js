'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('developers', {
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

      logo: {
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
    await queryInterface.addIndex('developers', ['slug']);
    await queryInterface.addIndex('developers', ['status']);
    await queryInterface.addIndex('developers', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('developers');
  }
};