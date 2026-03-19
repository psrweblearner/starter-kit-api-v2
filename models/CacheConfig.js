'use strict';

module.exports = (sequelize, DataTypes) => {
  const CacheConfig = sequelize.define(
    'CacheConfig',
    {
      // The scope of the cache (public, system, admin, or global)
      scope: {
        type: DataTypes.ENUM('public', 'system', 'admin', 'global'),
        allowNull: false,
        unique: true,
        defaultValue: 'global'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      // Backend hierarchy
      primary_backend: {
        type: DataTypes.ENUM('redis', 'upstash', 'node-cache'),
        defaultValue: 'node-cache'
      },
      secondary_backend: {
        type: DataTypes.ENUM('redis', 'upstash', 'node-cache', 'none'),
        defaultValue: 'none'
      },
      // Configuration objects
      redis_config: {
        type: DataTypes.JSON,
        defaultValue: {} // { host, port, password }
      },
      upstash_config: {
        type: DataTypes.JSON,
        defaultValue: {} // { url, token }
      },
      node_cache_config: {
        type: DataTypes.JSON,
        defaultValue: { stdTTL: 600, checkperiod: 60 }
      },
      // Status & Limits (manual or automatic monitoring)
      is_fallback_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // Automatically set to true if primary fails
      }
    },
    {
      tableName: 'cacheConfigs',
      underscored: true
    }
  );

  return CacheConfig;
};
