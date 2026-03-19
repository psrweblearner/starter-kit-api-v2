'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Menus', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      image: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      modifyBy: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('Menus');
  }
};

