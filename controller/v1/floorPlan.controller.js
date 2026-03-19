'use strict';
const services = require('../../services/v1');
const CacheKey = 'floor-plan-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.floorPlan.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Floor Plan created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.floorPlan.findAll(req);
    res.status(200).json({ message: 'Floor Plans fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.floorPlan.findOne(req);
    res.status(200).json({ message: 'Floor Plan fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.floorPlan.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Floor Plan updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.floorPlan.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Floor Plan deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.floorPlan.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Floor Plan status updated successfully', ...data, name });
})
