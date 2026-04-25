'use strict';

const { Op } = require('sequelize');
const {
  ColdOutreachRule,
  ColdOutreachLead,
  ColdOutreachLeadContact,
} = require('../../../models');
const AppError = require('../../../utils/AppError');
const { listQuery } = require('../../../utils/build_query');
const { getColdOutreachQueue } = require('../../../utils/queue/cold-outreach.queue');
const { fetchAllTextResults, placeDetails } = require('./google-places.service');
const { getUserIdFromReq, parseCsvInput, normalizeWebsite } = require('./shared');

const RULES_CACHE_KEY = 'cold-outreach-rules-list:';
const LEADS_CACHE_KEY = 'cold-outreach-leads-list:';

function parseRuleFilters(filters) {
  if (!filters) return {};
  if (typeof filters === 'object') return filters;
  if (typeof filters !== 'string') return {};
  try {
    const parsed = JSON.parse(filters);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function serializeRule(rule) {
  const normalizedFilters = parseRuleFilters(rule.filters);
  return {
    id: Number(rule.id),
    ruleName: rule.ruleName,
    filters: normalizedFilters,
    runStatus: rule.runStatus,
    lastRunAt: rule.lastRunAt || null,
    createdAt: rule.created_at || rule.createdAt || null,
  };
}

function serializeLead(lead) {
  return {
    id: Number(lead.id),
    ruleId: Number(lead.ruleId),
    businessName: lead.businessName,
    address: lead.address || '',
    rating: lead.rating == null ? null : Number(lead.rating),
    reviewCount: Number(lead.reviewCount || 0),
    phone: lead.phone || null,
    website: lead.website || null,
    status: lead.status || null,
    sourceKeyword: lead.sourceKeyword || null,
    sourceLocation: lead.sourceLocation || null,
    leadScore: Number(lead.leadScore || 0),
    tags: Array.isArray(lead.tags) ? lead.tags : [],
    createdAt: lead.created_at || lead.createdAt || null,
  };
}

function buildFilters(payload) {
  const filters = {
    searchKeywords: parseCsvInput(payload.search_keywords),
    locations: parseCsvInput(payload.locations),
    minRating: Number(payload.min_rating ?? 0),
    maxRating: Number(payload.max_rating ?? 5),
    minReviews: Number(payload.min_reviews ?? 0),
    maxReviews: Number(payload.max_reviews ?? 100000),
    phoneRequired: Boolean(payload.phone_required),
    websiteFilter: String(payload.website_filter || 'BOTH'),
    businessStatus: String(payload.business_status || 'BOTH'),
  };
  if (!filters.searchKeywords.length) throw new AppError('search_keywords is required', 400);
  if (!filters.locations.length) throw new AppError('locations is required', 400);
  return filters;
}

function applyLeadFilter(filters, details) {
  const rating = Number(details.rating || 0);
  const reviews = Number(details.user_ratings_total || 0);
  const phone = details.international_phone_number || details.formatted_phone_number || null;
  const website = normalizeWebsite(details.website);
  const status = String(details.business_status || 'UNKNOWN').toUpperCase();

  if (rating < filters.minRating || rating > filters.maxRating) return false;
  if (reviews < filters.minReviews || reviews > filters.maxReviews) return false;
  if (filters.phoneRequired && !phone) return false;
  if (filters.websiteFilter === 'WITH_WEBSITE' && !website) return false;
  if (filters.websiteFilter === 'WITHOUT_WEBSITE' && website) return false;
  if (filters.businessStatus !== 'BOTH') {
    const expected = filters.businessStatus === 'CLOSED' ? 'CLOSED_TEMPORARILY' : filters.businessStatus;
    if (status !== expected && !(filters.businessStatus === 'CLOSED' && status === 'CLOSED_PERMANENTLY')) return false;
  }
  return true;
}

function computeLeadScore(details, hasEmail, hasPhone) {
  const rating = Number(details.rating || 0);
  const reviews = Number(details.user_ratings_total || 0);
  let score = Math.round((rating / 5) * 40);
  score += Math.min(30, Math.round(reviews / 20));
  if (hasPhone) score += 15;
  if (hasEmail) score += 15;
  return Math.min(100, score);
}

async function createRule(req) {
  const userId = getUserIdFromReq(req);
  const ruleName = String(req.body?.rule_name || '').trim();
  if (!ruleName) throw new AppError('rule_name is required', 400);
  const filters = buildFilters(req.body || {});

  const rule = await ColdOutreachRule.create({
    userId,
    ruleName,
    filters,
    runStatus: 'completed',
  });
  return serializeRule(rule);
}

async function listRules(req) {
  const userId = getUserIdFromReq(req);
  const key = `${RULES_CACHE_KEY}${userId}:${JSON.stringify(req.query || {})}`;
  const { data, name } = await listQuery(ColdOutreachRule, req, key, {
    defaultAttributes: ['id', 'ruleName', 'filters', 'runStatus', 'lastRunAt', 'created_at'],
    where: { userId },
    order: [['created_at', 'DESC']],
  });
  if (data?.data) data.data = data.data.map(serializeRule);
  return { data, name };
}

async function runRule(req) {
  const userId = getUserIdFromReq(req);
  const id = Number(req.params.id);
  const rule = await ColdOutreachRule.findOne({ where: { id, userId } });
  if (!rule) throw new AppError('Rule not found', 404);
  await getColdOutreachQueue().add('rule-fetch', { ruleId: id, userId }, { jobId: `rule-fetch-${id}-${Date.now()}` });
  await rule.update({ runStatus: 'pending' });
  return serializeRule(rule);
}

async function getRule(req) {
  const userId = getUserIdFromReq(req);
  const id = Number(req.params.id);
  const rule = await ColdOutreachRule.findOne({ where: { id, userId }, attributes: ['id', 'ruleName', 'filters', 'runStatus', 'lastRunAt', 'created_at'] });
  if (!rule) throw new AppError('Rule not found', 404);
  return serializeRule(rule);
}

async function deleteRule(req) {
  const userId = getUserIdFromReq(req);
  const id = Number(req.params.id);
  const rule = await ColdOutreachRule.findOne({ where: { id, userId } });
  if (!rule) throw new AppError('Rule not found', 404);
  await rule.destroy();
  return { id, deleted: true };
}

async function listLeads(req) {
  const userId = getUserIdFromReq(req);
  const normalizedQuery = {
    ...req.query,
    page: req.query?.page ? String(req.query.page) : '1',
    limit: req.query?.limit ? String(req.query.limit) : '10',
  };
  const safeReq = { ...req, query: normalizedQuery };

  const ruleId = Number(normalizedQuery.ruleId || 0);
  let where = {};
  if (ruleId > 0) {
    const ownRule = await ColdOutreachRule.findOne({ where: { id: ruleId, userId }, attributes: ['id'] });
    if (!ownRule) {
      return { data: { status: true, total: 0, page: Number(normalizedQuery.page), limit: Number(normalizedQuery.limit) || 10, data: [] }, name: 'db' };
    }
    where.ruleId = ruleId;
  } else {
    const rules = await ColdOutreachRule.findAll({ where: { userId }, attributes: ['id'] });
    const ruleIds = rules.map((row) => Number(row.id));
    if (!ruleIds.length) {
      return { data: { status: true, total: 0, page: Number(normalizedQuery.page), limit: Number(normalizedQuery.limit) || 10, data: [] }, name: 'db' };
    }
    where.ruleId = { [Op.in]: ruleIds };
  }

  const key = `${LEADS_CACHE_KEY}${userId}:${JSON.stringify(normalizedQuery || {})}`;
  const { data, name } = await listQuery(ColdOutreachLead, safeReq, key, {
    defaultAttributes: ['id', 'ruleId', 'businessName', 'address', 'rating', 'reviewCount', 'phone', 'website', 'status', 'sourceKeyword', 'sourceLocation', 'leadScore', 'tags', 'created_at'],
    where,
    order: [['created_at', 'DESC']],
  });
  if (data?.data) {
    const leadIds = data.data.map((row) => Number(row.id));
    if (!leadIds.length) return { data, name };
    const contacts = await ColdOutreachLeadContact.findAll({
      where: { leadId: { [Op.in]: leadIds } },
      attributes: ['leadId', 'phone'],
    });
    const byLead = contacts.reduce((acc, row) => {
      const keyId = Number(row.leadId);
      if (!acc[keyId]) acc[keyId] = { phones: [] };
      if (row.phone) acc[keyId].phones.push(row.phone);
      return acc;
    }, {});
    data.data = data.data.map((row) => {
      const base = serializeLead(row);
      const ext = byLead[base.id] || { phones: [] };
      return { ...base, extraPhones: [...new Set(ext.phones)] };
    });
  }
  return { data, name };
}

async function exportLeadsCsv(req) {
  const userId = getUserIdFromReq(req);
  const ruleId = Number(req.query.ruleId || 0);
  const where = {};
  if (ruleId) {
    const ownRule = await ColdOutreachRule.findOne({ where: { id: ruleId, userId } });
    if (!ownRule) throw new AppError('Rule not found', 404);
    where.ruleId = ruleId;
  } else {
    const rules = await ColdOutreachRule.findAll({ where: { userId }, attributes: ['id'] });
    where.ruleId = { [Op.in]: rules.map((r) => Number(r.id)) };
  }
  const leads = await ColdOutreachLead.findAll({ where, order: [['created_at', 'DESC']] });
  const header = ['Name', 'Rating', 'Reviews', 'Phone', 'Website', 'Address', 'Status', 'Keyword', 'Location'];
  const rows = leads.map((lead) => [
    csvCell(lead.businessName),
    csvCell(lead.rating),
    csvCell(lead.reviewCount),
    csvCell(lead.phone),
    csvCell(lead.website),
    csvCell(lead.address),
    csvCell(lead.status),
    csvCell(lead.sourceKeyword || ''),
    csvCell(lead.sourceLocation || ''),
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function csvCell(value) {
  const text = String(value == null ? '' : value);
  return `"${text.replace(/"/g, '""')}"`;
}

async function processRuleJob({ ruleId, userId }) {
  const rule = await ColdOutreachRule.findOne({ where: { id: Number(ruleId), userId: Number(userId) } });
  if (!rule) throw new Error('Rule not found');
  const filters = parseRuleFilters(rule.filters);
  await rule.update({ runStatus: 'processing' });

  try {
    for (const keyword of filters.searchKeywords || []) {
      for (const location of filters.locations || []) {
        const query = `${keyword} in ${location}`;
        const results = await fetchAllTextResults(query);
        for (const place of results) {
          const placeId = place?.place_id;
          if (!placeId) continue;
          const detailsResponse = await placeDetails(placeId);
          const details = detailsResponse?.result || {};
          if (!applyLeadFilter(filters, details)) continue;

          const phone = details.international_phone_number || details.formatted_phone_number || null;
          const website = normalizeWebsite(details.website);
          const status = String(details.business_status || 'UNKNOWN').toUpperCase();
          const hasEmail = false;
          const leadScore = computeLeadScore(details, hasEmail, Boolean(phone));

          const [lead] = await ColdOutreachLead.findOrCreate({
            where: { ruleId: Number(rule.id), placeId },
            defaults: {
              ruleId: Number(rule.id),
              placeId,
              businessName: details.name || place.name || 'Unknown',
              address: details.formatted_address || place.formatted_address || null,
              rating: details.rating ?? null,
              reviewCount: details.user_ratings_total ?? null,
              phone,
              website,
              status,
              sourceKeyword: keyword,
              sourceLocation: location,
              leadScore,
              tags: buildTags(details, phone, website),
            },
          });

          if (phone) {
            await ColdOutreachLeadContact.findOrCreate({
              where: { leadId: Number(lead.id), phone, source: 'gmb' },
              defaults: { leadId: Number(lead.id), phone, source: 'gmb' },
            });
          }

        }
      }
    }
    await rule.update({ runStatus: 'completed', lastRunAt: new Date() });
  } catch (error) {
    await rule.update({ runStatus: 'failed', lastRunAt: new Date() });
    throw error;
  }
}

function buildTags(details, phone, website) {
  const tags = [];
  if (Number(details.rating || 0) >= 4.5) tags.push('high-rating');
  if (Number(details.user_ratings_total || 0) >= 100) tags.push('social-proof');
  if (phone) tags.push('phone-ready');
  if (website) tags.push('website-ready');
  return tags;
}

async function processScrapeJob({ leadId, website }) {
  return { skipped: true, reason: 'Website scraping disabled', leadId, website };
}

module.exports = {
  createRule,
  listRules,
  getRule,
  runRule,
  deleteRule,
  listLeads,
  exportLeadsCsv,
  processRuleJob,
  processScrapeJob,
};
