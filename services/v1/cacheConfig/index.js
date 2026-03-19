'use strict';

const { CacheConfig } = require('../../../models');
const cacheManager = require('../../../utils/cacheManager');
const AppError = require('../../../utils/AppError');

exports.findAll = async () => {
  return await CacheConfig.findAll();
};

exports.upsert = async (payload) => {
  const { scope = 'global' } = payload;

  let config = await CacheConfig.findOne({ where: { scope } });

  if (config) {
    // Update existing record - exclude id and scope from being updated
    const { id, scope: _, ...updateData } = payload;
    await config.update(updateData);
  } else {
    // Create new record
    config = await CacheConfig.create(payload);
  }

  // Refresh memory cache after update
  await cacheManager.refreshConfigs();

  return config;
};

exports.toggle = async (scope, isActive) => {
  const config = await CacheConfig.findOne({ where: { scope } });
  if (!config) throw new AppError('Config not found for this scope', 404);

  config.is_active = isActive;
  await config.save();

  await cacheManager.refreshConfigs();
  return config;
};
