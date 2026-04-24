'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function fetchPage(url) {
  return axios.get(url, {
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
}

module.exports = async (domain) => {
  const startedAt = Date.now();
  const urls = [`https://${domain}`, `http://${domain}`];

  try {
    let response;
    let lastError;
    for (const pageUrl of urls) {
      try {
        response = await fetchPage(pageUrl);
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!response) throw lastError || new Error('Unable to fetch page');
    const data = response?.data || '';

    const $ = cheerio.load(data);
    const allAnchors = $('a[href]').toArray().map((el) => $(el).attr('href')).filter(Boolean);
    const normalizedLinks = normalizeLinks(allAnchors, domain);
    const openGraph = extractMetaByPrefix($, 'property', 'og:');
    const twitter = extractMetaByPrefix($, 'name', 'twitter:');
    const schemaMarkup = $('script[type="application/ld+json"]').toArray().map((el) => {
      const value = $(el).html() || '';
      try {
        return JSON.parse(value);
      } catch (_error) {
        return value;
      }
    });
    const missingAltImages = $('img').toArray().filter((el) => !($(el).attr('alt') || '').trim()).length;
    const htmlSizeBytes = Buffer.byteLength(data, 'utf8');
    const headers = normalizeHeaders(response?.headers || {});

    return {
      status: 'completed',
      elapsedMs: Date.now() - startedAt,
      extracted: {
        title: $('title').text().trim() || null,
        metaDescription: $('meta[name="description"]').attr('content') || null,
        metaRobots: $('meta[name="robots"]').attr('content') || null,
        canonicalUrl: $('link[rel="canonical"]').attr('href') || null,
        headingCounts: {
          h1: $('h1').length,
          h2: $('h2').length,
          h3: $('h3').length,
          h4: $('h4').length,
          h5: $('h5').length,
          h6: $('h6').length,
        },
        images: {
          total: $('img').length,
          missingAlt: missingAltImages,
        },
        links: {
          total: normalizedLinks.internal.length + normalizedLinks.external.length,
          internal: normalizedLinks.internal,
          external: normalizedLinks.external,
        },
        openGraph,
        twitter,
        schemaMarkup,
        scriptTagsCount: $('script').length,
        cssFilesCount: $('link[rel="stylesheet"]').length,
        htmlSizeBytes,
      },
      trackingDetection: {
        googleTagManager: /googletagmanager\.com|gtm\.js/i.test(data),
        googleAnalytics: /google-analytics\.com|gtag\(|ga\(/i.test(data),
        facebookPixel: /connect\.facebook\.net|fbq\(/i.test(data),
        hotjar: /static\.hotjar\.com|hj\(/i.test(data),
        microsoftClarity: /clarity\.ms|window\.clarity/i.test(data),
        linkedInInsightTag: /snap\.licdn\.com|linkedin\.com\/insight/i.test(data),
      },
      techStack: {
        cms: detectCms(data, headers),
        framework: detectFramework(data),
        server: headers.server || null,
        cdn: detectCdn(headers),
      },
      raw: {
        finalUrl: response?.request?.res?.responseUrl || pageUrl,
        statusCode: response?.status || null,
        headers,
      },
    };
  } catch (e) {
    return {
      status: 'partial',
      elapsedMs: Date.now() - startedAt,
      error: e?.message || 'Scrape failed',
      extracted: null,
      raw: null,
    };
  }
};

function extractMetaByPrefix($, key, prefix) {
  const values = {};
  $(`meta[${key}]`).each((_index, el) => {
    const attr = ($(el).attr(key) || '').toLowerCase();
    if (!attr.startsWith(prefix)) return;
    values[attr] = $(el).attr('content') || null;
  });
  return values;
}

function normalizeLinks(hrefs, domain) {
  const internal = new Set();
  const external = new Set();

  hrefs.forEach((href) => {
    if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:')) return;

    try {
      const parsed = new URL(href, `https://${domain}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) return;
      const normalized = parsed.href;
      if (parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)) {
        internal.add(normalized);
      } else {
        external.add(normalized);
      }
    } catch (_error) {}
  });

  return {
    internal: [...internal].slice(0, 200),
    external: [...external].slice(0, 200),
  };
}

function normalizeHeaders(headers) {
  return Object.keys(headers).reduce((acc, key) => {
    acc[String(key).toLowerCase()] = headers[key];
    return acc;
  }, {});
}

function detectCms(html, headers) {
  if (/wp-content|wp-includes|wordpress/i.test(html)) return 'WordPress';
  if (/cdn\.shopify\.com|shopify/i.test(html)) return 'Shopify';
  if (/wix\.com|_wix/i.test(html)) return 'Wix';
  if (/squarespace/i.test(html)) return 'Squarespace';
  if (/drupal-settings-json|drupal/i.test(html) || String(headers['x-generator'] || '').toLowerCase().includes('drupal')) return 'Drupal';
  if (/joomla/i.test(html)) return 'Joomla';
  return 'Unknown';
}

function detectFramework(html) {
  if (/__NEXT_DATA__|_next\//i.test(html)) return 'Next.js';
  if (/data-reactroot|react/i.test(html)) return 'React';
  if (/ng-version|angular/i.test(html)) return 'Angular';
  if (/vue(\.runtime)?\.js|data-v-/i.test(html)) return 'Vue';
  if (/nuxt/i.test(html)) return 'Nuxt';
  return 'Unknown';
}

function detectCdn(headers) {
  const joined = JSON.stringify(headers).toLowerCase();
  if (joined.includes('cloudflare')) return 'Cloudflare';
  if (joined.includes('akamai')) return 'Akamai';
  if (joined.includes('fastly')) return 'Fastly';
  if (joined.includes('cloudfront')) return 'CloudFront';
  return 'Unknown';
}