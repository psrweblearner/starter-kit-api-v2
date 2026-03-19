'use strict';
const services = require('../../services/v1');
const CacheKey = 'menu-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.menu.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Menu created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.menu.findAll(req);
    res.status(200).json({ message: 'Menus fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.menu.findOne(req);
    res.status(200).json({ message: 'Menu fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.menu.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Menu updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.menu.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Menu deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.menu.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Menu status updated successfully', ...data, name });
})
exports.findAssignMenu = catchAsync(async (req, res) => {
    const { data, name } = await services.menu.findAssignMenu(req);
    res.status(200).json({ message: 'Assign menu fetched successfully', ...data, name });
})
exports.assign_subMenu = catchAsync(async (req, res) => {
    const { data, name } = await services.menu.assign_subMenu(req);
    await delCache(req, 'Assign-menu:*', true);
    res.status(200).json({ message: 'Assign menu updated successfully', ...data, name });
})