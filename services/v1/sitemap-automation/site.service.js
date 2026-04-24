'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const { Op } = require('sequelize');
const { AutomationSite, AutomationRun } = require('../../../models');
const { normalizeAutomationHost, buildAutomationStartUrl } = require('../../../utils/automationHost');
const AppError = require('../../../utils/AppError');
const sitemapAutomationLive = require('../../../utils/sitemapAutomationLive');
const { enqueueAutomationRun } = require('./enqueue-run.service');
const { computeNextRunAt } = require('./cron-utils');
const {
  getOwnedSiteOrThrow,
  createVerificationToken,
  serializeRun,
  serializeSite,
  getLatestRunForSite,
} = require('./shared');

async function upsertSiteConfig({
  userId,
  domain,
  googleIndexEnabled,
  googleProperty,
  indexApiConfigRef,
  publishEndpoint,
  publishSecret,
  publishPath,
}) {
  const normalized = normalizeAutomationHost(domain);
  if (!normalized) {
    throw new AppError('Invalid domain', 400);
  }

  const [site] = await AutomationSite.findOrCreate({
    where: { userId, domain: normalized },
    defaults: {
      userId,
      domain: normalized,
      verificationToken: createVerificationToken(),
      googleIndexEnabled: Boolean(googleIndexEnabled),
      googleProperty: googleProperty || null,
      indexApiConfigRef: indexApiConfigRef || null,
      publishEndpoint: publishEndpoint || null,
      publishSecret: publishSecret || null,
      publishPath: publishPath || 'public/sitemap.xml',
      lastPublishStatus: publishEndpoint && publishSecret ? 'pending' : 'not-configured',
      lastPublishMessage: publishEndpoint && publishSecret ? 'Will publish on next crawl' : 'Publish endpoint not configured',
    },
  });

  await site.update({
    googleIndexEnabled: typeof googleIndexEnabled === 'boolean' ? googleIndexEnabled : site.googleIndexEnabled,
    googleProperty: googleProperty === undefined ? site.googleProperty : googleProperty || null,
    indexApiConfigRef: indexApiConfigRef === undefined ? site.indexApiConfigRef : indexApiConfigRef || null,
    publishEndpoint: publishEndpoint === undefined ? site.publishEndpoint : publishEndpoint || null,
    publishSecret: publishSecret === undefined ? site.publishSecret : publishSecret || null,
    publishPath: publishPath === undefined ? site.publishPath : publishPath || 'public/sitemap.xml',
    lastPublishStatus:
      publishEndpoint === undefined && publishSecret === undefined
        ? site.lastPublishStatus
        : (publishEndpoint || publishSecret ? 'pending' : 'not-configured'),
    lastPublishMessage:
      publishEndpoint === undefined && publishSecret === undefined
        ? site.lastPublishMessage
        : (publishEndpoint || publishSecret ? 'Will publish on next crawl' : 'Publish endpoint not configured'),
  });

  const latestRun = await getLatestRunForSite(site.id);
  return serializeSite(site, latestRun);
}

async function getSiteConfig({ userId, siteId }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  const latestRun = await getLatestRunForSite(site.id);
  return serializeSite(site, latestRun);
}

async function listSites({ userId }) {
  const sites = await AutomationSite.findAll({
    where: { userId: Number(userId) },
    order: [['created_at', 'DESC']],
  });

  const output = await Promise.all(
    sites.map(async (site) => {
      const latestRun = await getLatestRunForSite(site.id);
      return serializeSite(site, latestRun);
    })
  );

  return output;
}

async function generateInstallScript({ userId, siteId }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  const token = site.verificationToken || createVerificationToken();
  if (!site.verificationToken) {
    await site.update({ verificationToken: token });
  }

  const apiHost = String(process.env.API_HOST || 'http://localhost:5000').replace(/\/+$/, '');
  const scriptSrc = `${apiHost}/v1/sitemap-automation/public/script.js?siteId=${site.id}&token=${encodeURIComponent(token)}`;

  const snippet = [
    '<!-- Sitemap Automation Boot Script -->',
    `<script async src="${scriptSrc}"></script>`,
    '<!-- Verification fallback tags -->',
    `<meta name="rankpilot-sitemap-verification" content="${token}" />`,
    `<meta name="rankpilot-sitemap-domain" content="${site.domain}" />`,
    '<!-- /Sitemap Automation Boot Script -->',
  ].join('\n');

  return {
    siteId: Number(site.id),
    domain: site.domain,
    verificationToken: token,
    snippet,
  };
}

async function verifySiteConnection({ userId, siteId }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  const baseCandidates = buildVerificationBaseUrls(site.domain);
  let scriptInstalled = false;
  let sitemapReachable = false;

  for (const baseUrl of baseCandidates) {
    try {
      const homepage = await axios.get(baseUrl, {
        timeout: 10000,
        responseType: 'text',
        validateStatus: (status) => status >= 200 && status < 500,
      });
      const html = String(homepage.data || '');
      if (site.verificationToken && html.includes(site.verificationToken)) {
        scriptInstalled = true;
        break;
      }
    } catch (_error) {
      // keep trying next candidate
    }
  }

  for (const baseUrl of baseCandidates) {
    try {
      const sitemapRes = await axios.get(`${baseUrl}/sitemap.xml`, {
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 500,
      });
      if (sitemapRes.status >= 200 && sitemapRes.status < 300) {
        sitemapReachable = true;
        break;
      }
    } catch (_error) {
      // keep trying next candidate
    }
  }

  await site.update({
    verifyScriptInstalled: scriptInstalled,
    verifySitemapReachable: sitemapReachable,
    isConnected: scriptInstalled,
  });

  const latestRun = await getLatestRunForSite(site.id);
  return {
    ...serializeSite(site, latestRun),
    verification: {
      scriptInstalled,
      sitemapReachable,
      isConnected: scriptInstalled,
    },
  };
}

async function checkDomainEligibility({ userId, domain }) {
  void userId;
  const normalized = normalizeAutomationHost(domain);
  if (!normalized) {
    throw new AppError('Invalid domain', 400);
  }

  const startUrl = buildAutomationStartUrl(normalized);
  const crawlCount = await crawlInternalUrlsCount(startUrl, 11);
  const isEligible = crawlCount > 10;

  return {
    domain: normalized,
    discoveredUrlCount: crawlCount,
    minimumRequired: 11,
    isEligible,
    message: isEligible
      ? 'Domain qualifies for automation setup.'
      : 'This domain currently does not meet the automation eligibility criteria. Please use a domain with more than 10 crawlable internal pages.',
  };
}

async function saveSchemaMarkup({ userId, siteId, schemaMarkupText }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  await site.update({
    schemaMarkupText: String(schemaMarkupText || ''),
    schemaAppliedStatus: schemaMarkupText ? 'applied' : 'not_applied',
  });
  const latestRun = await getLatestRunForSite(site.id);
  return serializeSite(site, latestRun);
}

function buildVerificationBaseUrls(domain) {
  const host = normalizeAutomationHost(domain);
  if (!host) return [];
  const primary = buildAutomationStartUrl(host);
  const fallback = primary && primary.startsWith('https://') ? `http://${host}` : `https://${host}`;
  return [primary, fallback].filter(Boolean);
}

async function setCronExpression({ userId, siteId, cronExpression }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  const normalizedExpression = String(cronExpression || '').trim();
  const nextRunAt = normalizedExpression ? computeNextRunAt(normalizedExpression, new Date()) : null;
  await site.update({
    cronExpression: normalizedExpression || null,
    nextRunAt,
  });
  const latestRun = await getLatestRunForSite(site.id);
  return serializeSite(site, latestRun);
}

async function runNow({ userId, siteId }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  const existingActive = await AutomationRun.findOne({
    where: {
      siteId: Number(site.id),
      status: { [Op.in]: ['queued', 'processing'] },
    },
  });
  if (existingActive) {
    throw new AppError('A run is already active for this site', 409);
  }

  return enqueueAutomationRun(site, { triggerType: 'manual' });
}

async function deleteSite({ userId, siteId }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  await site.destroy();
  return {
    id: Number(site.id),
    deleted: true,
  };
}

async function listRuns({ userId, siteId }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  const runs = await AutomationRun.findAll({
    where: { siteId: Number(site.id) },
    order: [['created_at', 'DESC']],
    limit: 30,
  });

  const output = await Promise.all(
    runs.map(async (run) => {
      if (run.status !== 'queued' && run.status !== 'processing') {
        return serializeRun(run);
      }
      const live = await sitemapAutomationLive.getProgress(run.id);
      return serializeRun(run, live);
    })
  );

  return {
    site: serializeSite(site, runs[0] || null),
    runs: output,
  };
}

async function getPublicSiteConfig({ siteId, token, host }) {
  const normalizedSiteId = Number(siteId);
  const site = await AutomationSite.findByPk(normalizedSiteId);
  if (!site) throw new AppError('Site not found', 404);
  if (!token || token !== site.verificationToken) throw new AppError('Invalid verification token', 403);

  const normalizedHost = normalizeAutomationHost(host || '');
  if (normalizedHost && normalizedHost !== site.domain) {
    throw new AppError('Domain mismatch for site config', 403);
  }

  return {
    siteId: Number(site.id),
    domain: site.domain,
    schemaMarkupText: site.schemaMarkupText || '',
    schemaAppliedStatus: site.schemaAppliedStatus,
    googleIndexEnabled: Boolean(site.googleIndexEnabled),
  };
}

async function markPublicScriptPing({ siteId, token, host }) {
  const normalizedSiteId = Number(siteId);
  const site = await AutomationSite.findByPk(normalizedSiteId);
  if (!site) throw new AppError('Site not found', 404);
  if (!token || token !== site.verificationToken) throw new AppError('Invalid verification token', 403);

  const normalizedHost = normalizeAutomationHost(host || '');
  if (normalizedHost && normalizedHost !== site.domain) {
    throw new AppError('Domain mismatch for ping', 403);
  }

  await site.update({
    verifyScriptInstalled: true,
    lastPingAt: new Date(),
    ...(site.verifiedAt ? {} : { verifiedAt: new Date() }),
    isConnected: true,
  });

  return {
    siteId: Number(site.id),
    domain: site.domain,
    verifyScriptInstalled: true,
    lastPingAt: site.lastPingAt || null,
    verifiedAt: site.verifiedAt || null,
    isConnected: true,
  };
}

async function savePublishConfig({ userId, siteId, publishEndpoint, publishSecret, publishPath }) {
  const site = await getOwnedSiteOrThrow(siteId, userId);
  await site.update({
    publishEndpoint: publishEndpoint || null,
    publishSecret: publishSecret || null,
    publishPath: publishPath || 'public/sitemap.xml',
    lastPublishStatus: publishEndpoint && publishSecret ? 'pending' : 'not-configured',
    lastPublishMessage: publishEndpoint && publishSecret ? 'Will publish on next crawl' : 'Publish endpoint not configured',
  });
  const latestRun = await getLatestRunForSite(site.id);
  return serializeSite(site, latestRun);
}

function canonicalizeCrawlUrl(raw, base) {
  try {
    const parsed = new URL(String(raw || '').trim(), base);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    parsed.hash = '';
    parsed.search = '';
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch (_error) {
    return null;
  }
}

function hostForUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch (_error) {
    return '';
  }
}

async function crawlInternalUrlsCount(startUrl, maxCount) {
  const start = canonicalizeCrawlUrl(startUrl);
  if (!start) return 0;
  const allowedHost = hostForUrl(start);
  const queue = [start];
  const visited = new Set();
  const queued = new Set([start]);
  const timeout = 8000;
  const maxVisits = Math.max(maxCount, 11);

  while (queue.length > 0 && visited.size < maxVisits) {
    const current = queue.shift();
    if (!current) continue;
    if (visited.has(current)) continue;

    try {
      const response = await axios.get(current, {
        timeout,
        responseType: 'text',
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500,
        headers: {
          'user-agent': 'RankpilotEligibilityBot/1.0',
          accept: 'text/html,application/xhtml+xml',
        },
      });
      if (response.status >= 400) continue;

      visited.add(current);
      if (visited.size >= maxVisits) break;

      const contentType = String(response.headers?.['content-type'] || '').toLowerCase();
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) continue;

      const $ = cheerio.load(String(response.data || ''));
      $('a[href]').each((_index, el) => {
        if (visited.size >= maxVisits) return;
        const href = $(el).attr('href');
        const next = canonicalizeCrawlUrl(href, current);
        if (!next) return;
        if (hostForUrl(next) !== allowedHost) return;
        if (visited.has(next) || queued.has(next)) return;
        queued.add(next);
        queue.push(next);
      });
    } catch (_error) {
      // Ignore failed pages for eligibility sampling.
    }
  }

  return visited.size;
}

module.exports = {
  upsertSiteConfig,
  listSites,
  getSiteConfig,
  checkDomainEligibility,
  generateInstallScript,
  verifySiteConnection,
  saveSchemaMarkup,
  setCronExpression,
  runNow,
  deleteSite,
  listRuns,
  getPublicSiteConfig,
  markPublicScriptPing,
  savePublishConfig,
};
