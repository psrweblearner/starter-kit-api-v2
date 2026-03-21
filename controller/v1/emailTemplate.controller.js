'use strict';
const services = require('../../services/v1');
const CacheKey = 'email-template-list:*'
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');
exports.create = catchAsync(async (req, res) => {
    const result = await services.emailTemplate.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'Email template created successfully', data: result });
})

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.emailTemplate.findAll(req);
    res.status(200).json({ message: 'Email templates fetched successfully', ...data, name });
})

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.emailTemplate.findOne(req);
    res.status(200).json({ message: 'Email template fetched successfully', ...data, name });
})
exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.emailTemplate.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Email template updated successfully', ...data, name });
})
exports.remove = catchAsync(async (req, res) => {
    await services.emailTemplate.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Email template deleted successfully' });
})
exports.updateStatus = catchAsync(async (req, res) => {
    const { data, name } = await services.emailTemplate.updateStatus(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Email template status updated successfully', ...data, name });
})
