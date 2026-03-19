'use strict';
const services = require('../../services/v1');
const CacheKey = 'property-type-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.propertyType.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Property Type created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.propertyType.findAll(req);
    res.status(200).json({ message: 'Property Types fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.propertyType.findOne(req);
    res.status(200).json({ message: 'Property Type fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.propertyType.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Property Type updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.propertyType.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Property Type deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.propertyType.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Property Type status updated successfully', ...data, name });
})
