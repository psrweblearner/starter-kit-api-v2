'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categorizables', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      categorizable_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the related model (blog, service, property, etc.)'
      },
      categorizable_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Model name (Blog, Service, Property, etc.)'
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

    // Add unique constraint to prevent duplicate associations
    await queryInterface.addConstraint('categorizables', {
      fields: ['category_id', 'categorizable_id', 'categorizable_type'],
      type: 'unique',
      name: 'unique_categorizable'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('categorizables', ['category_id']);
    await queryInterface.addIndex('categorizables', ['categorizable_id']);
    await queryInterface.addIndex('categorizables', ['categorizable_type']);
    await queryInterface.addIndex('categorizables', ['categorizable_id', 'categorizable_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categorizables');
  }
};
