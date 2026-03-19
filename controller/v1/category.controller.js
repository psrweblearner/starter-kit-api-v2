'use strict';
const services = require('../../services/v1');
const CacheKey = 'category-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.category.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Category created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.category.findAll(req);
    res.status(200).json({ message: 'Categories fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.category.findOne(req);
    res.status(200).json({ message: 'Category fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.category.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Category updated successfully', ...data, name });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.category.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Category status updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.category.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Category deleted successfully' });
})

