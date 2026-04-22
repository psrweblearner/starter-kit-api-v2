'use strict';

const crypto = require('crypto');
const AppError = require('../../../utils/AppError');
const { AutomationSite, AutomationRun } = require('../../../models');

function getUserIdFromReq(req) {
  const userId = Number(req?.user?.id || 0);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Unauthorized', 401);
  }
  return userId;
}

async function getOwnedSiteOrThrow(siteId, userId) {
  const normalizedSiteId = Number(siteId);
  if (!Number.isInteger(normalizedSiteId) || normalizedSiteId <= 0) {
    throw new AppError('Invalid site id', 400);
  }

  const site = await AutomationSite.findOne({
    where: { id: normalizedSiteId, userId },
  });
  if (!site) {
    throw new AppError('Automation site not found', 404);
  }
  return site;
}

function createVerificationToken() {
  return crypto.randomBytes(16).toString('hex');
}

function parseResultData(resultData) {
  if (!resultData) return null;
  if (typeof resultData === 'object') return resultData;
  try {
    return JSON.parse(resultData);
  } catch (_error) {
    return null;
  }
}

function serializeRun(run, live = null) {
  return {
    id: Number(run.id),
    siteId: Number(run.siteId),
    jobId: run.jobId ? Number(run.jobId) : null,
    triggerType: run.triggerType,
    status: run.status,
    startedAt: run.startedAt || null,
    finishedAt: run.finishedAt || null,
    discoveredCount: Number(run.discoveredCount || 0),
    failedCount: Number(run.failedCount || 0),
    externalCount: Number(run.externalCount || 0),
    sitemapUrl: run.sitemapUrl || null,
    indexSubmittedCount: Number(run.indexSubmittedCount || 0),
    indexFailedCount: Number(run.indexFailedCount || 0),
    errorSummary: run.errorSummary || null,
    resultData: parseResultData(run.resultData),
    live: live || undefined,
    createdAt: run.created_at || run.createdAt || null,
    updatedAt: run.updated_at || run.updatedAt || null,
  };
}

function serializeSite(site, latestRun = null) {
  return {
    id: Number(site.id),
    domain: site.domain,
    isConnected: Boolean(site.isConnected),
    verifyScriptInstalled: Boolean(site.verifyScriptInstalled),
    verifySitemapReachable: Boolean(site.verifySitemapReachable),
    schemaMarkupText: site.schemaMarkupText || '',
    schemaAppliedStatus: site.schemaAppliedStatus,
    cronExpression: site.cronExpression || null,
    lastRunAt: site.lastRunAt || null,
    nextRunAt: site.nextRunAt || null,
    googleIndexEnabled: Boolean(site.googleIndexEnabled),
    googleProperty: site.googleProperty || null,
    indexApiConfigRef: site.indexApiConfigRef || null,
    publishEndpoint: site.publishEndpoint || null,
    publishSecret: site.publishSecret || null,
    publishPath: site.publishPath || 'public/sitemap.xml',
    lastPingAt: site.lastPingAt || null,
    verifiedAt: site.verifiedAt || null,
    lastPublishAt: site.lastPublishAt || null,
    lastPublishStatus: site.lastPublishStatus || 'not-configured',
    lastPublishMessage: site.lastPublishMessage || null,
    latestRun: latestRun ? serializeRun(latestRun) : null,
    createdAt: site.created_at || site.createdAt || null,
    updatedAt: site.updated_at || site.updatedAt || null,
  };
}

async function getLatestRunForSite(siteId) {
  return AutomationRun.findOne({
    where: { siteId: Number(siteId) },
    order: [['created_at', 'DESC']],
  });
}

module.exports = {
  getUserIdFromReq,
  getOwnedSiteOrThrow,
  createVerificationToken,
  serializeRun,
  serializeSite,
  getLatestRunForSite,
};
