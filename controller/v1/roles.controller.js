'use strict';
const services = require('../../services/v1');
const CacheKey = 'roles-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.roles.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Role created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.roles.findAll(req);
    res.status(200).json({ message: 'Roles fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.roles.findOne(req);
    res.status(200).json({ message: 'Role fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.roles.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Role updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.roles.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Role deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.roles.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Role status updated successfully', ...data, name });
})
exports.roleSubmenuAssign = catchAsync(async (req, res) => {
    await services.roles.roleSubmenuAssign(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Submenu assigned to role successfully' });
})