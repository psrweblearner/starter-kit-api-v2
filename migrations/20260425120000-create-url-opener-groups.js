'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('url_opener_groups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      urls_json: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('url_opener_groups', ['user_id'], {
      name: 'idx_url_opener_groups_user_id',
    });
    await queryInterface.addIndex('url_opener_groups', ['name'], {
      name: 'idx_url_opener_groups_name',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('url_opener_groups');
  },
};
