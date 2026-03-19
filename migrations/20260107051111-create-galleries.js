'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('galleries', {
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
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      file_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: {
          model: 'files',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      alt: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          isInt: true,
          min: 0,
          max: 1
        }
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
    await queryInterface.addIndex('galleries', ['slug']);
    await queryInterface.addIndex('galleries', ['status']);
    await queryInterface.addIndex('galleries', ['sort_order']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('galleries');
  }
};
