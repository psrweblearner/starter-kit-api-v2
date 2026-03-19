'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('folders', {
      id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      parent_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        references: {
          model: 'folders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      full_path: {
        type: Sequelize.STRING(1000),
        allowNull: false
      },
      storage_provider: {
        type: Sequelize.ENUM('local', 'aws', 'gcp'),
        allowNull: false
      },
      createdBy: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('folders', ['parent_id']);
    await queryInterface.addIndex('folders', ['full_path']);
    await queryInterface.addIndex('folders', ['createdBy']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('folders');
  }
};
