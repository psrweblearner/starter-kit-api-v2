'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('propertytypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
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
    await queryInterface.addIndex('propertytypes', ['slug']);
    await queryInterface.addIndex('propertytypes', ['status']);
    await queryInterface.addIndex('propertytypes', ['title']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('propertytypes');
  }
};