'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    await queryInterface.bulkInsert('cacheConfigs', [
      {
        scope: 'global',
        is_active: true,
        primary_backend: 'node-cache',
        secondary_backend: 'none',
        node_cache_config: JSON.stringify({ stdTTL: 600, checkperiod: 60 }),
        redis_config: JSON.stringify({}),
        upstash_config: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        scope: 'public',
        is_active: true,
        primary_backend: 'redis',
        secondary_backend: 'node-cache',
        node_cache_config: JSON.stringify({ stdTTL: 600, checkperiod: 60 }),
        redis_config: JSON.stringify({ url: process.env.REDIS_URL }),
        upstash_config: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        scope: 'admin',
        is_active: true,
        primary_backend: 'upstash',
        secondary_backend: 'node-cache',
        node_cache_config: JSON.stringify({ stdTTL: 300, checkperiod: 60 }),
        redis_config: JSON.stringify({}),
        upstash_config: JSON.stringify({ url: process.env.UPSTASH_REDIS_URL }),
        created_at: now,
        updated_at: now
      },
      {
        scope: 'system',
        is_active: true,
        primary_backend: 'upstash',
        secondary_backend: 'node-cache',
        node_cache_config: JSON.stringify({ stdTTL: 300, checkperiod: 60 }),
        redis_config: JSON.stringify({}),
        upstash_config: JSON.stringify({ url: process.env.UPSTASH_REDIS_URL }),
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('cacheConfigs', null, {});
  }
};
