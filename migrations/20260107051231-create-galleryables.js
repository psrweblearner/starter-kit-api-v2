'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('galleryables', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      gallery_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'galleries',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      galleryable_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'ID of the related model (blog, service, property, etc.)'
      },
      galleryable_type: {
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
    await queryInterface.addConstraint('galleryables', {
      fields: ['gallery_id', 'galleryable_id', 'galleryable_type'],
      type: 'unique',
      name: 'unique_galleryable'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('galleryables', ['gallery_id']);
    await queryInterface.addIndex('galleryables', ['galleryable_id']);
    await queryInterface.addIndex('galleryables', ['galleryable_type']);
    await queryInterface.addIndex('galleryables', ['galleryable_id', 'galleryable_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('galleryables');
  }
};
