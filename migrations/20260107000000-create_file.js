'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'files';
    if (!(await queryInterface.tableExists(table))) {
      await queryInterface.createTable(table, {
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
    }

    // FK on folder_id already creates an index; do not addIndex(['folder_id']).
    const indexNames = new Set(
      (await queryInterface.showIndex(table)).map((idx) => idx.name)
    );
    if (!indexNames.has('files_reference_count')) {
      await queryInterface.addIndex(table, ['reference_count'], {
        name: 'files_reference_count'
      });
    }
    if (!indexNames.has('files_created_by')) {
      await queryInterface.addIndex(table, ['createdBy'], { name: 'files_created_by' });
    }
    if (!indexNames.has('files_mime_type')) {
      await queryInterface.addIndex(table, ['mime_type'], { name: 'files_mime_type' });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('files');
  }
};
