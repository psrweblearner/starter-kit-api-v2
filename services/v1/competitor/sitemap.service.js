'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (domain) => {
  const startedAt = Date.now();
  const httpsUrl = `https://${domain}`;
  const robotsUrl = `${httpsUrl}/robots.txt`;
  const sitemapUrl = `${httpsUrl}/sitemap.xml`;

  try {
    const [pageResult, robotsResult, sitemapResult] = await Promise.allSettled([
      axios.get(httpsUrl, { timeout: 10000 }),
      axios.get(robotsUrl, { timeout: 10000 }),
      axios.get(sitemapUrl, { timeout: 10000 }),
    ]);

    let sitemap = { exists: false, totalUrls: 0, indexEntries: 0, parseError: null };
    if (sitemapResult.status === 'fulfilled') {
      const sitemapData = sitemapResult.value?.data || '';
      try {
        const $xml = cheerio.load(sitemapData, { xmlMode: true });
        sitemap = {
          exists: true,
          totalUrls: $xml('url').length,
          indexEntries: $xml('sitemap').length,
          parseError: null,
        };
      } catch (parseErr) {
        sitemap = {
          exists: true,
          totalUrls: 0,
          indexEntries: 0,
          parseError: parseErr?.message || 'Failed to parse sitemap',
        };
      }
    }

    const brokenLinks = await collectBrokenLinks(domain, pageResult);

    return {
      status: 'completed',
      elapsedMs: Date.now() - startedAt,
      checks: {
        httpsEnabled: pageResult.status === 'fulfilled',
        robotsTxt: {
          exists: robotsResult.status === 'fulfilled',
          contentLength: robotsResult.status === 'fulfilled'
            ? Buffer.byteLength(String(robotsResult.value?.data || ''), 'utf8')
            : 0,
        },
        sitemap,
        brokenLinks,
      },
      raw: {
        robotsTxt: robotsResult.status === 'fulfilled' ? String(robotsResult.value?.data || '') : null,
        sitemapXml: sitemapResult.status === 'fulfilled' ? String(sitemapResult.value?.data || '') : null,
      },
    };
  } catch (e) {
    return {
      status: 'failed',
      elapsedMs: Date.now() - startedAt,
      error: e?.message || 'Technical checks failed',
      checks: {
        httpsEnabled: false,
        robotsTxt: { exists: false, contentLength: 0 },
        sitemap: { exists: false, totalUrls: 0, indexEntries: 0, parseError: null },
        brokenLinks: { checked: 0, brokenCount: 0, broken: [] },
      },
      raw: {
        robotsTxt: null,
        sitemapXml: null,
      },
    };
  }
};

async function collectBrokenLinks(domain, pageResult) {
  if (pageResult.status !== 'fulfilled') {
    return { checked: 0, brokenCount: 0, broken: [] };
  }

  const html = String(pageResult.value?.data || '');
  const $ = cheerio.load(html);
  const links = $('a[href]').toArray()
    .map((el) => $(el).attr('href'))
    .filter(Boolean)
    .slice(0, 30)
    .map((href) => {
      try {
        return new URL(href, `https://${domain}`).href;
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean);

  const checks = await Promise.allSettled(
    links.map((url) => axios.get(url, {
      timeout: 5000,
      maxRedirects: 3,
      validateStatus: () => true,
    }))
  );

  const broken = [];
  checks.forEach((result, index) => {
    if (result.status === 'rejected') {
      broken.push({ url: links[index], reason: result.reason?.message || 'Request failed' });
      return;
    }

    const statusCode = result.value?.status || 0;
    if (statusCode >= 400) {
      broken.push({ url: links[index], statusCode });
    }
  });

  return {
    checked: links.length,
    brokenCount: broken.length,
    broken,
  };
}