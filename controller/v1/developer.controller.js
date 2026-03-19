'use strict';
const services = require('../../services/v1');
const CacheKey = 'developer-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.developer.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Developer created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.developer.findAll(req);
    res.status(200).json({ message: 'Developers fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.developer.findOne(req);
    res.status(200).json({ message: 'Developer fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.developer.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Developer updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.developer.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Developer deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.developer.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Developer status updated successfully', ...data, name });
})
