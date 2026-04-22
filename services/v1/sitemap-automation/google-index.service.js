'use strict';

const axios = require('axios');

/**
 * Best-effort sitemap ping + optional web indexing submission.
 * Web indexing uses IndexNow-style payload with server-side WEB_INDEX_KEY.
 */
async function submitToGoogleIndexing({ sitemapUrl, site, urls = [] }) {
  if (!site.googleIndexEnabled || !sitemapUrl) {
    return {
      submittedCount: 0,
      failedCount: 0,
      errors: [],
    };
  }

  const errors = [];
  let submittedCount = 0;
  const indexableUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];

  if (site.googleProperty) {
    const endpoint = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    try {
      await axios.get(endpoint, { timeout: 8000, validateStatus: (status) => status >= 200 && status < 500 });
      submittedCount += 1;
    } catch (error) {
      errors.push(error?.message || 'Google sitemap ping failed');
    }
  }

  if (indexableUrls.length > 0) {
    const webIndexKey = String(process.env.WEB_INDEX_KEY || '').trim();
    const webIndexEndpoint = String(process.env.WEB_INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow').trim();
    const timeoutMs = Number(process.env.WEB_INDEX_TIMEOUT_MS || 12000);
    const host = String(site.domain || '').trim().toLowerCase();

    if (!webIndexKey) {
      errors.push('WEB_INDEX_KEY is missing on server');
    } else if (!host) {
      errors.push('Site domain is missing for web indexing');
    } else {
      try {
        const payload = {
          host,
          key: webIndexKey,
          urlList: indexableUrls,
        };
        const response = await axios.post(
          webIndexEndpoint,
          payload,
          {
            timeout: Number.isFinite(timeoutMs) ? timeoutMs : 12000,
            headers: {
              'content-type': 'application/json',
            },
            validateStatus: (status) => status >= 200 && status < 500,
          }
        );

        if (response.status >= 200 && response.status < 300) {
          const acceptedCount = Number(response.data?.submittedCount || response.data?.accepted || indexableUrls.length);
          submittedCount += Number.isFinite(acceptedCount) ? acceptedCount : indexableUrls.length;
        } else {
          errors.push(`Web indexing service rejected request (${response.status})`);
        }
      } catch (error) {
        errors.push(error?.message || 'Web indexing request failed');
      }
    }
  }

  return {
    submittedCount,
    failedCount: errors.length,
    errors,
  };
}

module.exports = {
  submitToGoogleIndexing,
};
