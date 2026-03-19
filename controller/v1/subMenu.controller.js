'use strict';
const services = require('../../services/v1');
const CacheKey = 'submenu-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.subMenu.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Submenu created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.subMenu.findAll(req);
    res.status(200).json({ message: 'Submenus fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.subMenu.findOne(req);
    res.status(200).json({ message: 'Submenu fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.subMenu.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Submenu updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.subMenu.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Submenu deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.subMenu.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Submenu status updated successfully', ...data, name });
})
