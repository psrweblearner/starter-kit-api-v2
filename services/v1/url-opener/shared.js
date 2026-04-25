'use strict';

const AppError = require('../../../utils/AppError');
const { UrlOpenerGroup } = require('../../../models');

const MAX_URLS_PER_GROUP = 120;

function getUserIdFromReq(req) {
  const userId = Number(req?.user?.id || 0);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Unauthorized', 401);
  }
  return userId;
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return null;
  return `https://${raw}`;
}

function normalizeUrls(input) {
  if (!Array.isArray(input)) return [];
  const deduped = [...new Set(input.map(normalizeUrl).filter(Boolean))];
  return deduped.slice(0, MAX_URLS_PER_GROUP);
}

function parseUrlsJson(urlsJson) {
  if (!urlsJson) return [];
  try {
    const parsed = JSON.parse(urlsJson);
    return Array.isArray(parsed) ? normalizeUrls(parsed) : [];
  } catch (_error) {
    return [];
  }
}

function serializeGroup(group) {
  return {
    id: Number(group.id),
    userId: Number(group.userId),
    name: group.name,
    urls: parseUrlsJson(group.urlsJson),
    createdAt: group.created_at || group.createdAt || null,
    updatedAt: group.updated_at || group.updatedAt || null,
  };
}

async function getOwnedGroupOrThrow(groupId, userId) {
  const id = Number(groupId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid group id', 400);
  }
  const group = await UrlOpenerGroup.findOne({ where: { id, userId } });
  if (!group) throw new AppError('URL group not found', 404);
  return group;
}

module.exports = {
  MAX_URLS_PER_GROUP,
  getUserIdFromReq,
  normalizeUrls,
  serializeGroup,
  getOwnedGroupOrThrow,
};
