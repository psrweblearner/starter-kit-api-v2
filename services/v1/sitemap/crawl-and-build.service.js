'use strict';

const fs = require('fs/promises');
const path = require('path');
const http = require('http');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');

const sitemapLive = require('../../../utils/sitemapLive');

const DEFAULT_MAX_URLS = Number(process.env.SITEMAP_MAX_URLS || 50000);
const DEFAULT_MAX_DEPTH = Number(process.env.SITEMAP_MAX_DEPTH || 10);
const DEFAULT_CONCURRENCY = Number(process.env.SITEMAP_CONCURRENCY || 12);
const DEFAULT_TIMEOUT_MS = Number(process.env.SITEMAP_REQUEST_TIMEOUT_MS || 10000);
const HARD_MAX_URLS = Number(process.env.SITEMAP_HARD_MAX_URLS || 50000);
const SITEMAP_CHUNK_SIZE = 50000;
const EXTERNAL_URL_CAP = 10000;
const BROKEN_URL_CAP = 10000;
const LIVE_LIST_PREVIEW = 120;
const PROGRESS_FLUSH_MS = 250;

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 120 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 120 });

module.exports = async function crawlAndBuildSitemap(payload) {
  const startedAt = Date.now();
  const jobId = payload.jobId ? String(payload.jobId) : null;
  const domain = String(payload.domain || '').trim().toLowerCase();
  const startUrl = String(payload.startUrl || '').trim();
  const includeImages = Boolean(payload.includeImages);
  const includeVideos = Boolean(payload.includeVideos);
  const maxUrls = normalizeMaxUrls(payload.maxUrls, DEFAULT_MAX_URLS, HARD_MAX_URLS);
  const maxDepth = normalizeInteger(payload.maxDepth, DEFAULT_MAX_DEPTH, 1, 15);
  const concurrency = normalizeInteger(payload.concurrency, DEFAULT_CONCURRENCY, 1, 60);
  const timeoutMs = normalizeInteger(process.env.SITEMAP_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 1000, 30000);

  let stopRequested = false;
  let lastProgressFlush = 0;

  const flushProgress = async (progress, force = false) => {
    if (!jobId) return;
    const now = Date.now();
    if (!force && now - lastProgressFlush < PROGRESS_FLUSH_MS) return;
    lastProgressFlush = now;
    await sitemapLive.setProgress(jobId, progress);
  };

  const crawler = new LocalCrawler({
    startUrl: startUrl || `https://${domain}`,
    limit: maxUrls,
    maxDepth,
    concurrency,
    timeoutMs,
    onProgress: (p) => {
      void flushProgress({
        stage: 'crawling',
        urlsInSitemap: p.totalFound,
        queueDepth: p.queueSize,
        externalCount: p.externalLinksCount,
        notFoundCount: p.brokenLinksCount,
        failedCount: p.brokenLinksCount,
        externalUrls: p.externalLinks.slice(0, LIVE_LIST_PREVIEW),
        notFoundUrls: p.brokenLinks.slice(0, LIVE_LIST_PREVIEW),
        effectiveMaxUrls: maxUrls,
        stopRequested,
        processedPages: p.processedPages,
        activeConcurrency: concurrency,
      });
    },
  });

  await flushProgress({
    stage: 'crawling',
    urlsInSitemap: 0,
    queueDepth: 1,
    externalCount: 0,
    notFoundCount: 0,
    failedCount: 0,
    externalUrls: [],
    notFoundUrls: [],
    effectiveMaxUrls: maxUrls,
    stopRequested: false,
    processedPages: 0,
    activeConcurrency: concurrency,
  }, true);

  const stopMonitor = jobId
    ? setInterval(async () => {
      try {
        const shouldStop = await sitemapLive.isStopRequested(jobId);
        if (shouldStop) {
          stopRequested = true;
          crawler.stop();
        }
      } catch (_error) {}
    }, 500)
    : null;

  let crawlResult;
  try {
    crawlResult = await crawler.crawl();
  } finally {
    if (stopMonitor) clearInterval(stopMonitor);
  }

  const entries = crawlResult.visitedUrls.map((url) => ({
    url,
    lastmod: toIsoDate(null),
    images: includeImages ? Array.from(new Set(crawlResult.pageMedia[url]?.images || [])) : [],
    videos: includeVideos ? Array.from(new Set(crawlResult.pageMedia[url]?.videos || [])) : [],
  }));
  const dedupedEntries = dedupeMediaAcrossEntries(entries, {
    includeImages,
    includeVideos,
  });

  await flushProgress({
    stage: 'saving',
    urlsInSitemap: dedupedEntries.length,
    queueDepth: 0,
    externalCount: crawlResult.externalLinks.length,
    notFoundCount: crawlResult.brokenLinks.length,
    failedCount: crawlResult.brokenLinks.length,
    externalUrls: crawlResult.externalLinks.slice(0, LIVE_LIST_PREVIEW),
    notFoundUrls: crawlResult.brokenLinks.slice(0, LIVE_LIST_PREVIEW),
    effectiveMaxUrls: maxUrls,
    stopRequested,
    processedPages: crawlResult.totalFound + crawlResult.brokenLinks.length,
    activeConcurrency: concurrency,
  }, true);

  let saved = {
    publicUrl: null,
    filePath: null,
    generatedFiles: [],
    splitSitemaps: 0,
  };
  if (dedupedEntries.length > 0) {
    saved = await saveSitemapFiles({
      domain,
      urls: dedupedEntries,
      includeImages,
      includeVideos,
    });
  }

  const status = stopRequested ? 'stopped' : (crawlResult.brokenLinks.length > 0 ? 'partial' : 'completed');

  return {
    status,
    domain,
    includeImages,
    includeVideos,
    totalUrls: dedupedEntries.length,
    sitemapUrl: saved.publicUrl,
    sitemapFilePath: saved.filePath,
    generatedFiles: saved.generatedFiles,
    splitSitemaps: saved.splitSitemaps,
    maxUrls,
    maxDepth,
    concurrency,
    unboundedRequested: maxUrls >= HARD_MAX_URLS,
    elapsedMs: Date.now() - startedAt,
    errors: crawlResult.brokenLinks.map((url) => ({ url, error: 'Failed to crawl URL' })),
    stopped: stopRequested,
    processedPages: crawlResult.totalFound + crawlResult.brokenLinks.length,
    failedCount: crawlResult.brokenLinks.length,
    externalUrls: crawlResult.externalLinks.slice(0, EXTERNAL_URL_CAP),
    notFoundUrls: crawlResult.brokenLinks.slice(0, BROKEN_URL_CAP),
    externalCount: crawlResult.externalLinks.length,
    notFoundCount: crawlResult.brokenLinks.length,
  };
};

class LocalCrawler {
  constructor(config) {
    this.startUrl = canonicalizeUrl(config.startUrl);
    this.limit = config.limit;
    this.maxDepth = config.maxDepth;
    this.concurrency = config.concurrency;
    this.timeoutMs = config.timeoutMs;
    this.onProgress = typeof config.onProgress === 'function' ? config.onProgress : () => {};

    this.queue = [{ url: this.startUrl, depth: 0 }];
    this.inQueue = new Set([this.startUrl]);
    this.visited = new Set();
    this.brokenLinks = new Set();
    this.externalLinks = new Set();
    this.pageMedia = {};
    this._inFlight = 0;
    this.shouldStop = false;
    this.baseHost = normalizeHost(this.startUrl);
  }

  stop() {
    this.shouldStop = true;
  }

  emitProgress() {
    this.onProgress({
      totalFound: this.visited.size,
      brokenLinksCount: this.brokenLinks.size,
      externalLinksCount: this.externalLinks.size,
      queueSize: this.queue.length + this._inFlight,
      processedPages: this.visited.size + this.brokenLinks.size,
      externalLinks: Array.from(this.externalLinks),
      brokenLinks: Array.from(this.brokenLinks),
    });
  }

  enqueue(rawHref, currentUrl, depth) {
    if (this.shouldStop || this.visited.size >= this.limit) return;
    if (depth > this.maxDepth) return;
    const absolute = canonicalizeUrl(rawHref, currentUrl);
    if (!absolute) return;
    if (normalizeHost(absolute) !== this.baseHost) {
      if (!this.externalLinks.has(absolute)) this.externalLinks.add(absolute);
      return;
    }
    if (this.visited.has(absolute) || this.brokenLinks.has(absolute) || this.inQueue.has(absolute)) return;
    this.inQueue.add(absolute);
    this.queue.push({ url: absolute, depth });
  }

  async processOne(item) {
    if (this.shouldStop) return;
    this.inQueue.delete(item.url);
    const currentUrl = item.url;
    try {
      const response = await axios.get(currentUrl, {
        timeout: this.timeoutMs,
        maxRedirects: 5,
        httpAgent,
        httpsAgent,
        responseType: 'text',
        validateStatus: (statusCode) => statusCode < 600,
        headers: {
          'user-agent': 'SitemapGeneratorBot/1.0 (+https://localhost)',
          accept: 'text/html,application/xhtml+xml',
        },
      });

      if (this.shouldStop) return;
      if (response.status >= 400) {
        this.brokenLinks.add(currentUrl);
        this.emitProgress();
        return;
      }

      this.visited.add(currentUrl);
      if (this.visited.size >= this.limit) {
        this.queue.length = 0;
        this.inQueue.clear();
      }

      const contentType = String(response.headers?.['content-type'] || '').toLowerCase();
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        this.pageMedia[currentUrl] = { images: [], videos: [] };
        this.emitProgress();
        return;
      }

      const $ = cheerio.load(String(response.data || ''));
      this.pageMedia[currentUrl] = extractMediaRefsFromHtml($, currentUrl);

      $('a[href]').each((_idx, el) => {
        const href = $(el).attr('href');
        if (href) this.enqueue(href, currentUrl, item.depth + 1);
      });

      this.emitProgress();
    } catch (_error) {
      this.brokenLinks.add(currentUrl);
      this.emitProgress();
    }
  }

  async crawl() {
    const workers = Array.from({ length: this.concurrency }, () => this.workerLoop());
    await Promise.all(workers);
    return {
      visitedUrls: Array.from(this.visited),
      brokenLinks: Array.from(this.brokenLinks),
      externalLinks: Array.from(this.externalLinks),
      pageMedia: this.pageMedia,
      totalFound: this.visited.size,
    };
  }

  async workerLoop() {
    while (!this.shouldStop) {
      if (this.queue.length === 0) {
        if (this._inFlight === 0) break;
        await waitMs(10);
        continue;
      }
      const item = this.queue.shift();
      if (!item) continue;
      this._inFlight += 1;
      try {
        await this.processOne(item);
      } finally {
        this._inFlight -= 1;
      }
    }
  }
}

function dedupeMediaAcrossEntries(entries, options = {}) {
  const includeImages = Boolean(options.includeImages);
  const includeVideos = Boolean(options.includeVideos);
  const seenImages = new Set();
  const seenVideos = new Set();

  return entries.map((entry) => {
    const next = { ...entry };
    if (includeImages) {
      const images = Array.isArray(entry.images) ? entry.images : [];
      next.images = images.filter((img) => {
        if (!img || seenImages.has(img)) return false;
        seenImages.add(img);
        return true;
      });
    }
    if (includeVideos) {
      const videos = Array.isArray(entry.videos) ? entry.videos : [];
      next.videos = videos.filter((video) => {
        if (!video || seenVideos.has(video)) return false;
        seenVideos.add(video);
        return true;
      });
    }
    return next;
  });
}

function extractMediaRefsFromHtml($, currentPageUrl) {
  const images = new Set();
  const videos = new Set();
  const push = (set, raw) => {
    const abs = mediaAbsolute(raw, currentPageUrl);
    if (abs) set.add(abs);
  };

  $('img[src], img[data-src], meta[property="og:image"], meta[property="og:image:url"], meta[name="twitter:image"]').each((_i, el) => {
    push(images, $(el).attr('src') || $(el).attr('data-src') || $(el).attr('content'));
  });
  $('video[src], video source[src], iframe[src], meta[property="og:video"], meta[property="og:video:url"], meta[property="og:video:secure_url"]').each((_i, el) => {
    push(videos, $(el).attr('src') || $(el).attr('content'));
  });
  return { images: Array.from(images), videos: Array.from(videos) };
}

function mediaAbsolute(raw, baseUrl) {
  if (!raw) return null;
  try {
    const u = new URL(String(raw).trim(), baseUrl);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    u.hash = '';
    return u.toString();
  } catch (_error) {
    return null;
  }
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

async function saveSitemapFiles(config) {
  const { domain, urls, includeImages, includeVideos } = config;
  const safeDomain = domain.replace(/[^a-z0-9.-]/gi, '-');
  const folderName = `${safeDomain}-${Date.now()}`;
  const outputDir = path.join(process.cwd(), 'public', 'sitemaps', folderName);
  await fs.mkdir(outputDir, { recursive: true });

  const splitSitemaps = chunkArray(urls, SITEMAP_CHUNK_SIZE);
  const generatedFiles = [];
  if (splitSitemaps.length <= 1) {
    const filePath = path.join(outputDir, 'sitemap.xml');
    await fs.writeFile(filePath, buildSitemapXml(urls, { includeImages, includeVideos }), 'utf8');
    generatedFiles.push(filePath);
    return { filePath, generatedFiles, splitSitemaps: 1, publicUrl: `/sitemaps/${folderName}/sitemap.xml` };
  }

  const sitemapUrls = [];
  for (let i = 0; i < splitSitemaps.length; i += 1) {
    const fileName = `sitemap-${i + 1}.xml`;
    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, buildSitemapXml(splitSitemaps[i], { includeImages, includeVideos }), 'utf8');
    generatedFiles.push(filePath);
    sitemapUrls.push(`/sitemaps/${folderName}/${fileName}`);
  }
  const indexFilePath = path.join(outputDir, 'sitemap-index.xml');
  await fs.writeFile(indexFilePath, buildSitemapIndexXml(sitemapUrls), 'utf8');
  generatedFiles.push(indexFilePath);
  return { filePath: indexFilePath, generatedFiles, splitSitemaps: splitSitemaps.length, publicUrl: `/sitemaps/${folderName}/sitemap-index.xml` };
}

function buildSitemapXml(entries, options) {
  const includeImages = options?.includeImages;
  const includeVideos = options?.includeVideos;
  const xmlns = [
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    includeImages ? 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : '',
    includeVideos ? 'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"' : '',
  ].filter(Boolean).join(' ');

  const body = entries.map((entry) => {
    const images = includeImages ? (entry.images || []).map((img) => `    <image:image><image:loc>${xmlEscape(img)}</image:loc></image:image>`).join('\n') : '';
    const videos = includeVideos ? (entry.videos || []).map((v) => `    <video:video><video:content_loc>${xmlEscape(v)}</video:content_loc></video:video>`).join('\n') : '';
    return ['  <url>', `    <loc>${xmlEscape(entry.url)}</loc>`, `    <lastmod>${xmlEscape(entry.lastmod || toIsoDate(null))}</lastmod>`, '    <changefreq>weekly</changefreq>', `    <priority>${entry.url.endsWith('/') ? '1.0' : '0.8'}</priority>`, images, videos, '  </url>'].filter(Boolean).join('\n');
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${xmlns}>\n${body}\n</urlset>\n`;
}

function buildSitemapIndexXml(sitemapUrls) {
  const now = toIsoDate(null);
  const body = sitemapUrls.map((url) => ['  <sitemap>', `    <loc>${xmlEscape(url)}</loc>`, `    <lastmod>${now}</lastmod>`, '  </sitemap>'].join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

function chunkArray(items, size) {
  if (items.length === 0) return [[]];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function xmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function toIsoDate(input) {
  if (!input) return new Date().toISOString().split('T')[0];
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

function normalizeInteger(rawValue, fallback, min, max) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function normalizeMaxUrls(rawValue, fallback, hardMax) {
  const value = Number(rawValue);
  const seed = Number.isFinite(value) ? Math.floor(value) : fallback;
  if (seed <= 0) return hardMax;
  return Math.min(seed, hardMax);
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
