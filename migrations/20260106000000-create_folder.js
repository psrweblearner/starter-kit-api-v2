'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'folders';
    if (!(await queryInterface.tableExists(table))) {
      await queryInterface.createTable(table, {
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
    }

    // FK on parent_id already creates an index; do not addIndex(['parent_id']) — duplicate key name.
    const indexNames = new Set(
      (await queryInterface.showIndex(table)).map((idx) => idx.name)
    );
    if (!indexNames.has('folders_full_path')) {
      await queryInterface.addIndex(table, ['full_path'], { name: 'folders_full_path' });
    }
    if (!indexNames.has('folders_created_by')) {
      await queryInterface.addIndex(table, ['createdBy'], { name: 'folders_created_by' });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('folders');
  }
};
