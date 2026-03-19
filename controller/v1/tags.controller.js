'use strict';
const services = require('../../services/v1');
const CacheKey = 'tags-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.tags.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Tag created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.tags.findAll(req);
    res.status(200).json({ message: 'Tags fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.tags.findOne(req);
    res.status(200).json({ message: 'Tag fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.tags.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Tag updated successfully', ...data, name });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.tags.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Tag status updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.tags.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Tag deleted successfully' });
})

