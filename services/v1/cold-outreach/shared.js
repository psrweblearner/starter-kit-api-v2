'use strict';

const AppError = require('../../../utils/AppError');

function getUserIdFromReq(req) {
  const userId = Number(req?.user?.id || 0);
  if (Number.isInteger(userId) && userId > 0) return userId;
  const fallbackUserId = Number(process.env.COLD_OUTREACH_DEFAULT_USER_ID || 1);
  if (Number.isInteger(fallbackUserId) && fallbackUserId > 0) return fallbackUserId;
  throw new AppError('Unauthorized', 401);
}

function parseCsvInput(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWebsite(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

module.exports = {
  getUserIdFromReq,
  parseCsvInput,
  normalizeWebsite,
};
