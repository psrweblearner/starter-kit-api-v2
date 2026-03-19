'use strict';

const services = require('../../services/v1');

exports.findAll = async (req, res) => {
  const result = await services.cacheConfig.findAll();
  res.status(200).json({ status: true, success: true, data: result });
};

exports.upsert = async (req, res) => {
  console.log('Upsert Payload:', req.body);
  const result = await services.cacheConfig.upsert(req.body);
  res.status(200).json({ status: true, success: true, message: 'Cache configuration updated', data: result });
};

exports.toggle = async (req, res) => {
  console.log('Toggle Params:', req.params, req.body);
  const { scope } = req.params;
  const { is_active } = req.body;
  const result = await services.cacheConfig.toggle(scope, is_active);
  res.status(200).json({ status: true, success: true, message: `Cache ${is_active ? 'enabled' : 'disabled'} for ${scope}`, data: result });
};
