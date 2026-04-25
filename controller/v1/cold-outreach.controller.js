'use strict';

const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');
const { delCache } = require('../../utils/cacheManager');

const RULES_CACHE = 'cold-outreach-rules-list:*';
const LEADS_CACHE = 'cold-outreach-leads-list:*';

function service() {
  return services['cold-outreach'];
}

exports.createRule = catchAsync(async (req, res) => {
  const data = await service().createRule(req);
  await delCache(req, RULES_CACHE, true);
  return res.status(201).json({ success: true, message: 'Rule created successfully', data });
});

exports.listRules = catchAsync(async (req, res) => {
  const { data, name } = await service().listRules(req);
  return res.status(200).json({ success: true, message: 'Rules fetched successfully', ...data, name });
});

exports.getRule = catchAsync(async (req, res) => {
  const data = await service().getRule(req);
  return res.status(200).json({ success: true, message: 'Rule fetched successfully', data });
});

exports.runRule = catchAsync(async (req, res) => {
  const data = await service().runRule(req);
  await delCache(req, RULES_CACHE, true);
  return res.status(200).json({ success: true, message: 'Rule run queued successfully', data });
});

exports.deleteRule = catchAsync(async (req, res) => {
  const data = await service().deleteRule(req);
  await delCache(req, RULES_CACHE, true);
  await delCache(req, LEADS_CACHE, true);
  return res.status(200).json({ success: true, message: 'Rule deleted successfully', data });
});

exports.listLeads = catchAsync(async (req, res) => {
  const { data, name } = await service().listLeads(req);
  return res.status(200).json({ success: true, message: 'Leads fetched successfully', ...data, name });
});

exports.exportLeadsCsv = catchAsync(async (req, res) => {
  const csv = await service().exportLeadsCsv(req);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cold-outreach-leads.csv"');
  return res.status(200).send(csv);
});
