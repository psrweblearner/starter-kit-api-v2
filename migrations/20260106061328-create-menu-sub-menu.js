'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MenuSubMenus', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      menuId: {
        type: Sequelize.INTEGER,
        references: { model: 'Menus', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      subMenuId: {
        type: Sequelize.INTEGER,
        references: { model: 'SubMenus', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
    await queryInterface.dropTable('MenuSubMenus');
  }
};
