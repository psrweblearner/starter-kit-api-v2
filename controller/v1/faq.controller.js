'use strict';
const services = require('../../services/v1');
const catchAsync = require('../../utils/catchAsync');
const CacheKey = 'faq-list:*'
const { delCache } = require('../../utils/cacheManager');

exports.create = catchAsync(async (req, res) => {
    const result = await services.faq.create(req);
    await delCache(req, CacheKey, true);
    res.status(201).json({ message: 'FAQ created successfully', data: result.data });
});

exports.findAll = catchAsync(async (req, res) => {
    const { data, name } = await services.faq.findAll(req);
    res.status(200).json({ message: 'FAQs fetched successfully', ...data, name });
});

exports.findOne = catchAsync(async (req, res) => {
    const { data, name } = await services.faq.findOne(req);
    res.status(200).json({ message: 'FAQ fetched successfully', ...data, name });
});

exports.update = catchAsync(async (req, res) => {
    const { data, name } = await services.faq.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'FAQ updated successfully', ...data, name });
});

exports.remove = catchAsync(async (req, res) => {
    const result = await services.faq.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: result.message });
});

exports.updateStatus = catchAsync(async (req, res) => {
    // Re-use update for status toggle
    const { data, name } = await services.faq.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Status updated successfully', ...data, name });
});
