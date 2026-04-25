'use strict';

const services = require('../../services/v1');
const { delCache } = require('../../utils/cacheManager');
const catchAsync = require('../../utils/catchAsync');

const LIST_CACHE_KEY = 'url-opener-groups-list:*';
const DETAIL_CACHE_KEY = 'url-opener-group-detail:*';

exports.create = catchAsync(async (req, res) => {
  const data = await services['url-opener'].create(req);
  await delCache(req, LIST_CACHE_KEY, true);
  return res.status(201).json({
    success: true,
    message: 'URL group created successfully',
    data,
  });
});

exports.findAll = catchAsync(async (req, res) => {
  const { data, name } = await services['url-opener'].findAll(req);
  return res.status(200).json({
    success: true,
    message: 'URL groups fetched successfully',
    ...data,
    name,
  });
});

exports.findOne = catchAsync(async (req, res) => {
  const { data, name } = await services['url-opener'].findOne(req);
  return res.status(200).json({
    success: true,
    message: 'URL group fetched successfully',
    ...data,
    name,
  });
});

exports.update = catchAsync(async (req, res) => {
  const data = await services['url-opener'].update(req);
  await delCache(req, LIST_CACHE_KEY, true);
  await delCache(req, DETAIL_CACHE_KEY, true);
  return res.status(200).json({
    success: true,
    message: 'URL group updated successfully',
    data,
  });
});

exports.remove = catchAsync(async (req, res) => {
  const data = await services['url-opener'].delete(req);
  await delCache(req, LIST_CACHE_KEY, true);
  await delCache(req, DETAIL_CACHE_KEY, true);
  return res.status(200).json({
    success: true,
    message: 'URL group deleted successfully',
    data,
  });
});
