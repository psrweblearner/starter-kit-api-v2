'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cacheConfigs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      scope: {
        type: Sequelize.ENUM('public', 'system', 'admin', 'global'),
        allowNull: false,
        unique: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      primary_backend: {
        type: Sequelize.ENUM('redis', 'upstash', 'node-cache'),
        defaultValue: 'node-cache'
      },
      secondary_backend: {
        type: Sequelize.ENUM('redis', 'upstash', 'node-cache', 'none'),
        defaultValue: 'none'
      },
      redis_config: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      upstash_config: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      node_cache_config: {
        type: Sequelize.JSON,
        defaultValue: { stdTTL: 600, checkperiod: 60 }
      },
      is_fallback_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cacheConfigs');
  }
};
