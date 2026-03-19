'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AdminUserRoles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      adminUserId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'AdminUsers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      roleId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      access:{
        type: Sequelize.STRING,
        defaultValue:"own"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AdminUserRoles');
  }
};