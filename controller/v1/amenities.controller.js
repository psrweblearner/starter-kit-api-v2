'use strict';
const services = require('../../services/v1');
const CacheKey = 'amenities-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.amenities.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Amenity created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.amenities.findAll(req);
    res.status(200).json({ message: 'Amenities fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.amenities.findOne(req);
    res.status(200).json({ message: 'Amenity fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.amenities.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Amenity updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.amenities.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Amenity deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.amenities.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Amenity status updated successfully', ...data, name });
})
