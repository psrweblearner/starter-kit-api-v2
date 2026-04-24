'use strict';

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_TIMEOUT_MS = Number(process.env.SITEMAP_REQUEST_TIMEOUT_MS || 10000);
const DEFAULT_MAX_URLS = Number(process.env.SITEMAP_BASELINE_MAX_URLS || 50000);
const DEFAULT_HEALTH_CONCURRENCY = Number(process.env.SITEMAP_BASELINE_HEALTH_CONCURRENCY || 20);
const DEFAULT_PARSE_MAX_FILES = Number(process.env.SITEMAP_BASELINE_MAX_FILES || 50);
const DEFAULT_HEALTH_MAX_URLS = Number(process.env.SITEMAP_BASELINE_HEALTH_MAX_URLS || 2000);

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 120 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 120 });

async function loadExistingSitemapBaseline(options = {}) {
  const startUrl = canonicalizeUrl(options.startUrl);
  if (!startUrl) {
    return emptyBaseline();
  }

  const timeoutMs = normalizeInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 1000, 30000);
  const maxUrls = normalizeInteger(options.maxUrls, DEFAULT_MAX_URLS, 1, 50000);
  const healthConcurrency = normalizeInteger(options.healthConcurrency, DEFAULT_HEALTH_CONCURRENCY, 1, 100);
  const maxFiles = normalizeInteger(options.maxFiles, DEFAULT_PARSE_MAX_FILES, 1, 200);
  const healthMaxUrls = normalizeInteger(options.healthMaxUrls, DEFAULT_HEALTH_MAX_URLS, 1, 50000);
  const host = normalizeHost(startUrl);

  const sourceCandidates = buildSourceCandidates(startUrl);
  const discoveredSitemaps = new Set();
  for (const source of sourceCandidates) discoveredSitemaps.add(source);

  const robotsSitemaps = await loadRobotsSitemapHints(startUrl, timeoutMs);
  for (const item of robotsSitemaps) discoveredSitemaps.add(item);

  const parseQueue = Array.from(discoveredSitemaps);
  const parsedFiles = new Set();
  const knownUrls = new Set();
  const knownMediaByUrl = {};
  let sitemapDetected = false;

  while (parseQueue.length > 0 && parsedFiles.size < maxFiles && knownUrls.size < maxUrls) {
    const sitemapUrl = parseQueue.shift();
    if (!sitemapUrl || parsedFiles.has(sitemapUrl)) continue;
    parsedFiles.add(sitemapUrl);
    const xml = await fetchText(sitemapUrl, timeoutMs);
    if (!xml) continue;
    sitemapDetected = true;

    const parsed = parseSitemapXml(xml, sitemapUrl);
    for (const childSitemap of parsed.sitemapLocs) {
      if (!parsedFiles.has(childSitemap)) parseQueue.push(childSitemap);
    }

    for (const entry of parsed.urlEntries) {
      if (knownUrls.size >= maxUrls) break;
      const normalized = canonicalizeUrl(entry.url);
      if (!normalized) continue;
      if (normalizeHost(normalized) !== host) continue;
      knownUrls.add(normalized);
      const current = knownMediaByUrl[normalized] || { images: new Set(), videos: new Set() };
      for (const image of entry.images || []) current.images.add(image);
      for (const video of entry.videos || []) current.videos.add(video);
      knownMediaByUrl[normalized] = current;
    }
  }

  const knownList = Array.from(knownUrls);
  const healthCheckSkipped = knownList.length > healthMaxUrls;
  const healthInput = healthCheckSkipped ? knownList.slice(0, healthMaxUrls) : knownList;
  const health = await checkUrlsHealth(healthInput, {
    timeoutMs,
    concurrency: healthConcurrency,
  });
  const uncheckedUrls = healthCheckSkipped ? knownList.slice(healthMaxUrls) : [];
  const effectiveWorkingUrls = Array.from(new Set([...health.workingUrls, ...uncheckedUrls]));
  const effectiveBrokenUrls = health.brokenUrls;

  const workingSet = new Set(effectiveWorkingUrls);
  const workingMediaByUrl = {};
  for (const url of Object.keys(knownMediaByUrl)) {
    if (!workingSet.has(url)) continue;
    const media = knownMediaByUrl[url];
    workingMediaByUrl[url] = {
      images: Array.from(media.images || []),
      videos: Array.from(media.videos || []),
    };
  }

  return {
    hasExistingSitemap: sitemapDetected,
    knownUrls: knownList,
    knownWorkingUrls: effectiveWorkingUrls,
    knownBrokenUrls: effectiveBrokenUrls,
    knownMediaByUrl: workingMediaByUrl,
    totalKnown: knownList.length,
    totalKnownWorking: effectiveWorkingUrls.length,
    totalKnownBroken: effectiveBrokenUrls.length,
    checkedCount: health.checkedCount,
    healthCheckSkipped,
    healthCheckCap: healthMaxUrls,
  };
}

async function loadRobotsSitemapHints(startUrl, timeoutMs) {
  try {
    const robotsUrl = new URL('/robots.txt', startUrl).toString();
    const body = await fetchText(robotsUrl, timeoutMs);
    if (!body) return [];
    const hints = [];
    const lines = String(body).split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*sitemap\s*:\s*(.+)$/i);
      if (!match) continue;
      const maybe = canonicalizeUrl(match[1].trim(), robotsUrl);
      if (maybe) hints.push(maybe);
    }
    return hints;
  } catch (_error) {
    return [];
  }
}

function parseSitemapXml(xml, baseUrl) {
  const output = { urlEntries: [], sitemapLocs: [] };
  try {
    const $xml = cheerio.load(String(xml || ''), { xmlMode: true });
    $xml('url').each((_idx, node) => {
      const $node = $xml(node);
      const raw = $node.find('loc').first().text().trim();
      const normalized = canonicalizeUrl(raw, baseUrl);
      if (!normalized) return;
      const images = [];
      const videos = [];
      $node.find('image\\:loc, loc').each((_i, mediaNode) => {
        const parentTag = String($xml(mediaNode).parent()?.get(0)?.tagName || '').toLowerCase();
        if (!parentTag.includes('image')) return;
        const value = canonicalizeUrl($xml(mediaNode).text().trim(), baseUrl);
        if (value) images.push(value);
      });
      $node.find('video\\:content_loc, video\\:player_loc, loc').each((_i, mediaNode) => {
        const parentTag = String($xml(mediaNode).parent()?.get(0)?.tagName || '').toLowerCase();
        if (!parentTag.includes('video')) return;
        const value = canonicalizeUrl($xml(mediaNode).text().trim(), baseUrl);
        if (value) videos.push(value);
      });
      output.urlEntries.push({
        url: normalized,
        images,
        videos,
      });
    });
    $xml('sitemap > loc').each((_idx, node) => {
      const raw = $xml(node).text().trim();
      const normalized = canonicalizeUrl(raw, baseUrl);
      if (normalized) output.sitemapLocs.push(normalized);
    });
  } catch (_error) {}
  if (output.urlEntries.length === 0 && output.sitemapLocs.length === 0) {
    return parseSitemapXmlWithRegex(String(xml || ''), baseUrl);
  }
  if (output.urlEntries.length === 0) {
    const fallback = parseSitemapXmlWithRegex(String(xml || ''), baseUrl);
    if (fallback.urlEntries.length > 0) output.urlEntries = fallback.urlEntries;
  }
  if (output.sitemapLocs.length === 0) {
    const fallback = parseSitemapXmlWithRegex(String(xml || ''), baseUrl);
    if (fallback.sitemapLocs.length > 0) output.sitemapLocs = fallback.sitemapLocs;
  }
  return output;
}

function parseSitemapXmlWithRegex(xml, baseUrl) {
  const output = { urlEntries: [], sitemapLocs: [] };
  const raw = String(xml || '');

  const sitemapBlocks = raw.matchAll(/<sitemap\b[^>]*>([\s\S]*?)<\/sitemap>/gi);
  for (const match of sitemapBlocks) {
    const block = String(match?.[1] || '');
    const locMatch = block.match(/<loc>\s*([^<]+)\s*<\/loc>/i);
    if (!locMatch) continue;
    const normalized = canonicalizeUrl(locMatch[1], baseUrl);
    if (normalized) output.sitemapLocs.push(normalized);
  }

  const urlBlocks = raw.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi);
  for (const match of urlBlocks) {
    const block = String(match?.[1] || '');
    const locMatch = block.match(/<loc>\s*([^<]+)\s*<\/loc>/i);
    const url = canonicalizeUrl(locMatch?.[1] || '', baseUrl);
    if (!url) continue;
    const images = [];
    const videos = [];
    const imageMatches = block.matchAll(/<image:loc>\s*([^<]+)\s*<\/image:loc>/gi);
    for (const imageMatch of imageMatches) {
      const normalized = canonicalizeUrl(imageMatch?.[1] || '', baseUrl);
      if (normalized) images.push(normalized);
    }
    const videoMatches = block.matchAll(/<(?:video:content_loc|video:player_loc)>\s*([^<]+)\s*<\/(?:video:content_loc|video:player_loc)>/gi);
    for (const videoMatch of videoMatches) {
      const normalized = canonicalizeUrl(videoMatch?.[1] || '', baseUrl);
      if (normalized) videos.push(normalized);
    }
    output.urlEntries.push({ url, images, videos });
  }
  return output;
}

async function checkUrlsHealth(urls, options = {}) {
  const timeoutMs = normalizeInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 1000, 30000);
  const concurrency = normalizeInteger(options.concurrency, DEFAULT_HEALTH_CONCURRENCY, 1, 100);
  const queue = Array.isArray(urls) ? urls.slice() : [];
  const workingUrls = [];
  const brokenUrls = [];

  async function workerLoop() {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const healthy = await isUrlHealthy(current, timeoutMs);
      if (healthy) workingUrls.push(current);
      else brokenUrls.push(current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, Math.max(queue.length, 1)) }, () => workerLoop());
  await Promise.all(workers);

  return {
    checkedCount: workingUrls.length + brokenUrls.length,
    workingUrls,
    brokenUrls,
  };
}

async function isUrlHealthy(url, timeoutMs) {
  const head = await requestWithMethod(url, 'HEAD', timeoutMs);
  if (head.ok) return true;
  if (head.retryWithGet) {
    const get = await requestWithMethod(url, 'GET', timeoutMs);
    return get.ok;
  }
  return false;
}

async function requestWithMethod(url, method, timeoutMs) {
  try {
    const response = await axios.request({
      url,
      method,
      timeout: timeoutMs,
      maxRedirects: 5,
      httpAgent,
      httpsAgent,
      responseType: 'text',
      validateStatus: () => true,
      headers: {
        'user-agent': 'SitemapGeneratorBot/1.0 (+https://localhost)',
      },
    });
    const status = Number(response.status || 0);
    const ok = status > 0 && status < 400;
    const retryWithGet = method === 'HEAD' && (status === 405 || status === 501 || status === 403);
    return { ok, retryWithGet };
  } catch (_error) {
    return { ok: false, retryWithGet: method === 'HEAD' };
  }
}

async function fetchText(url, timeoutMs) {
  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      maxRedirects: 5,
      httpAgent,
      httpsAgent,
      responseType: 'arraybuffer',
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'user-agent': 'SitemapGeneratorBot/1.0 (+https://localhost)',
      },
    });
    const rawBuffer = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data || '');
    const isGzipByUrl = /\.xml\.gz(?:$|\?)/i.test(url);
    const encoding = String(response.headers?.['content-encoding'] || '').toLowerCase();
    const isGzipByHeader = encoding.includes('gzip');
    if (isGzipByUrl || isGzipByHeader) {
      try {
        return zlib.gunzipSync(rawBuffer).toString('utf8');
      } catch (_gzipError) {
        return rawBuffer.toString('utf8');
      }
    }
    return rawBuffer.toString('utf8');
  } catch (_error) {
    return '';
  }
}

function buildSourceCandidates(startUrl) {
  const output = new Set();
  const parsed = new URL(startUrl);
  output.add(new URL('/sitemap.xml', parsed.origin).toString());
  if (parsed.protocol === 'https:') {
    output.add(new URL('/sitemap.xml', `http://${parsed.host}`).toString());
  } else {
    output.add(new URL('/sitemap.xml', `https://${parsed.host}`).toString());
  }
  return Array.from(output);
}

function canonicalizeUrl(raw, base) {
  if (!raw) return null;
  try {
    const u = new URL(String(raw).trim(), base);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    u.hash = '';
    u.search = '';
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
    return u.toString();
  } catch (_error) {
    return null;
  }
}

function normalizeHost(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch (_error) {
    return '';
  }
}

function normalizeInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function emptyBaseline() {
  return {
    hasExistingSitemap: false,
    knownUrls: [],
    knownWorkingUrls: [],
    knownBrokenUrls: [],
    knownMediaByUrl: {},
    totalKnown: 0,
    totalKnownWorking: 0,
    totalKnownBroken: 0,
    checkedCount: 0,
    healthCheckSkipped: false,
    healthCheckCap: DEFAULT_HEALTH_MAX_URLS,
  };
}

module.exports = {
  loadExistingSitemapBaseline,
};
