'use strict';
const services = require('../../services/v1');
const catchAsync = require('../../utils/catchAsync');
const CacheKey = 'blogs-list:*'
const { delCache } = require('../../utils/cacheManager');
exports.create = catchAsync(async (req, res) => {
    const result = await services.blogs.create(req);
    await delCache(req, CacheKey, true);

    res.status(201).json({ message: 'Blog created successfully', data: result });
});


exports.findAll = async (req, res) => {
    const { data, name } = await services.blogs.findAll(req);
    res.status(200).json({ message: 'Blogs fetched successfully', ...data, name });
}
exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.blogs.findOne(req);
    res.status(200).json({ message: 'Blog fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.blogs.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Blog updated successfully', ...data, name });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.blogs.updateStatus(req);
    await delCache(req, CacheKey, true);

    res.status(200).json({ message: 'Blog status updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.blogs.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Blog deleted successfully' });
})