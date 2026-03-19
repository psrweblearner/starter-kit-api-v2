'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AdminUsers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true   // ✅ make unique
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true   // ✅ already unique
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false, // ✅ always generated
        unique: true      // ✅ keep slug unique
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true   // ✅ already unique
      },
      about: Sequelize.TEXT,
      profile: Sequelize.STRING,
      address: Sequelize.STRING,
      designation: Sequelize.STRING,
      is_agent: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      license: Sequelize.STRING,
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_verify: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      pwd: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: false
      },
      modifyBy: Sequelize.STRING,
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
    await queryInterface.dropTable('AdminUsers');
  }
};
