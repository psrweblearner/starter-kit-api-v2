'use strict';
const services = require('../../services/v1');
const CacheKey = 'settings-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.setting.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Setting created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.setting.findAll(req);
    res.status(200).json({ message: 'Settings fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.setting.findOne(req);
    res.status(200).json({ message: 'Setting fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.setting.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Setting updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.setting.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Setting deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.setting.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Setting status updated successfully', ...data, name });
})