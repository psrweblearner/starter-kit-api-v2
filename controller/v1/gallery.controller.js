'use strict';
const services = require('../../services/v1');
const catchAsync = require('../../utils/catchAsync');
const CacheKey = 'gallery-list:*'
const { delCache } = require('../../utils/cacheManager');

exports.create = catchAsync(async (req, res) => {
    const result = await services.gallery.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Gallery item created successfully', data: result });
});

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.gallery.findAll(req);
    res.status(200).json({ message: 'Gallery items fetched successfully', ...data, name });
});
exports.findOne = catchAsync(async (req, res) => {
    const {data, name} = await services.gallery.findOne(req);
    res.status(200).json({ message: 'Gallery item fetched successfully', ...data, name });
});
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.gallery.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Gallery item updated successfully', ...data, name });
});

exports.remove = catchAsync(async (req, res) => {
    const result = await services.gallery.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: result.message });
});

exports.updateStatus = catchAsync(async (req, res) => {
    // Re-use update for status toggle
    const { data, name } = await services.gallery.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Status updated successfully', ...data, name });
});
