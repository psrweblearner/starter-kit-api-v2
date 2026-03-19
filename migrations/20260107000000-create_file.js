'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_name: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(1000),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      storage_provider: {
        type: Sequelize.ENUM('local', 'aws', 'gcp', 'azure'),
        allowNull: false
      },
      folder_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        references: {
          model: 'folders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      folder_path: {
        type: Sequelize.STRING(1000),
        allowNull: false,
        defaultValue: ''
      },
      reference_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    await queryInterface.addIndex('files', ['folder_id']);
    await queryInterface.addIndex('files', ['reference_count']);
    await queryInterface.addIndex('files', ['createdBy']);
    await queryInterface.addIndex('files', ['mime_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('files');
  }
};
