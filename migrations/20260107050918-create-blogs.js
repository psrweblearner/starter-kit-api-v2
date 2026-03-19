'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blogs', {
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
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT('long'),
        allowNull: true
      },
      file_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        // references: {
        //   model: 'files',
        //   key: 'id'
        // },
        // onUpdate: 'CASCADE',
        // onDelete: 'SET NULL',
        comment: 'Reference to file in files table'
      },
      status: {
        type: Sequelize.TINYINT,
        defaultValue: 0, // 0 = draft, 1 = published
        allowNull: false
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      author: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'AdminUsers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      modifiedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      publishedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('blogs', ['slug']);
    await queryInterface.addIndex('blogs', ['status']);
    await queryInterface.addIndex('blogs', ['author']);
    await queryInterface.addIndex('blogs', ['createdBy']);
    await queryInterface.addIndex('blogs', ['publishedAt']);
    await queryInterface.addIndex('blogs', ['file_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('blogs');
  }
};
