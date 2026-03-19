'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#6c757d'
      },
      usage_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      createdBy: {
        type: Sequelize.STRING,
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

    // Add indexes for better performance
    await queryInterface.addIndex('tags', ['slug']);
    await queryInterface.addIndex('tags', ['status']);
    await queryInterface.addIndex('tags', ['usage_count']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tags');
  }
};
