// migrations/xxxx-create-api-clients.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('apiClients', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: Sequelize.STRING,
      domain: Sequelize.STRING,
      api_key: Sequelize.STRING,
      allow_all: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('apiClients');
  }
};
