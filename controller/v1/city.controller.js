'use strict';
const services = require('../../services/v1');
const CacheKey = 'city-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.city.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'City created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.city.findAll(req);
    res.status(200).json({ message: 'Cities fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.city.findOne(req);
    res.status(200).json({ message: 'City fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.city.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'City updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.city.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'City deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.city.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'City status updated successfully', ...data, name });
})
