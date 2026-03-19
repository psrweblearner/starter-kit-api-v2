'use strict';
const services = require('../../services/v1');
const CacheKey = 'api-clients-list:*'
const { delCache } = require('../../utils/cacheManager');
exports.create = async (req, res) => {
  const result = await services.apiclient.create(req.body);
  await delCache(req, CacheKey, true);
  res.status(201).json({ message: 'API Client created successfully', data: result });
}

exports.findAll = async (req, res) => {
  const { data, name } = await services.apiclient.findAll(req);
  res.status(200).json({ message: 'API Clients fetched successfully', ...data, name });
}

exports.findOne = async (req, res) => {
  const { data, name } = await services.apiclient.findOne(req);
  res.status(200).json({ message: 'API Client fetched successfully', ...data, name });
}
exports.update = async (req, res) => {
  const { data, name } = await services.apiclient.update(req);
  await delCache(req, CacheKey, true);
  res.status(200).json({ message: 'API Client updated successfully', ...data, name });
}
exports.delete = async (req, res) => {
  await services.apiclient.delete(req);
  await delCache(req, CacheKey, true);
  res.status(200).json({ message: 'API Client deleted successfully' });
}