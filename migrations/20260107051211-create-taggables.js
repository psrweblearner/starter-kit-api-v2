'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('taggables', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      taggable_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the related model (blog, service, property, etc.)'
      },
      taggable_type: {
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
    await queryInterface.addConstraint('taggables', {
      fields: ['tag_id', 'taggable_id', 'taggable_type'],
      type: 'unique',
      name: 'unique_taggable'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('taggables', ['tag_id']);
    await queryInterface.addIndex('taggables', ['taggable_id']);
    await queryInterface.addIndex('taggables', ['taggable_type']);
    await queryInterface.addIndex('taggables', ['taggable_id', 'taggable_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('taggables');
  }
};
