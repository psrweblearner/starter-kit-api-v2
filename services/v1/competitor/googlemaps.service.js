'use strict';

const axios = require('axios');

const REQUEST_TIMEOUT_MS = Number(process.env.GMAPS_TIMEOUT_MS || 10000);
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error) {
  const status = Number(error?.response?.status || 0);
  if (RETRYABLE_STATUS.has(status)) return true;
  const code = String(error?.code || '').toUpperCase();
  return ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(code);
}

function normalizeError(error) {
  const status = Number(error?.response?.status || 0);
  const apiMessage = error?.response?.data?.error_message || error?.response?.data?.error?.message;
  if (apiMessage) return status ? `${apiMessage} (HTTP ${status})` : apiMessage;
  return error?.message || 'Google Maps lookup failed';
}

async function requestWithRetry(url, params) {
  const maxAttempts = 2;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await axios.get(url, { timeout: REQUEST_TIMEOUT_MS, params });
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error)) throw error;
      await wait(200 * attempt);
    }
  }
  throw lastError;
}

module.exports = async ({ domain, businessName }) => {
  const startedAt = Date.now();
  const apiKey = process.env.GOOGLE_MAP_KEY;
  const primaryQuery = String(businessName || domain || '').trim();
  const fallbackQuery = String(domain || '').replace(/^www\./i, '').split('.').slice(0, -1).join(' ');

  if (!apiKey) {
    return {
      status: 'partial',
      elapsedMs: Date.now() - startedAt,
      error: 'GOOGLE_MAP_KEY is missing',
      data: {
        rating: null,
        totalReviews: null,
        placeId: null,
        businessName: primaryQuery || null,
      },
      raw: null,
    };
  }

  if (!primaryQuery) {
    return {
      status: 'partial',
      elapsedMs: Date.now() - startedAt,
      error: 'No businessName/domain provided for Maps lookup',
      data: {
        rating: null,
        totalReviews: null,
        placeId: null,
        businessName: null,
      },
      raw: null,
    };
  }

  try {
    const textSearchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const queries = [primaryQuery, fallbackQuery].filter(Boolean);
    let searchResponse = null;
    let best = null;

    let selectedQuery = primaryQuery;
    for (const query of queries) {
      const response = await requestWithRetry(textSearchUrl, { query, key: apiKey });
      if (response?.data?.status === 'REQUEST_DENIED') {
        return {
          status: 'partial',
          elapsedMs: Date.now() - startedAt,
          error: response.data?.error_message || 'Google Maps request denied',
          data: {
            rating: null,
            totalReviews: null,
            placeId: null,
            businessName: query,
          },
          raw: {
            textSearch: response.data || null,
            placeDetails: null,
          },
        };
      }
      searchResponse = response;
      selectedQuery = query;
      const candidates = Array.isArray(response?.data?.results) ? response.data.results.slice(0, 5) : [];
      if (!candidates.length) continue;

      best = await pickBestCandidate(candidates, domain, apiKey);
      if (best?.place_id) break;
    }

    if (!best?.place_id) {
      return {
        status: 'completed',
        elapsedMs: Date.now() - startedAt,
        data: {
          rating: 0,
          totalReviews: 0,
          placeId: null,
          businessName: primaryQuery,
        },
        raw: {
          textSearch: searchResponse?.data || null,
          placeDetails: null,
        },
      };
    }

    const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const details = best.details || {};
    return {
      status: 'completed',
      elapsedMs: Date.now() - startedAt,
      data: {
        rating: details.rating ?? null,
        totalReviews: details.user_ratings_total ?? null,
        placeId: best.place_id,
        businessName: details.name || selectedQuery,
      },
      raw: {
        textSearch: searchResponse.data || null,
        placeDetails: details || null,
      },
    };
  } catch (error) {
    return {
      status: 'partial',
      elapsedMs: Date.now() - startedAt,
      error: normalizeError(error),
      data: {
        rating: null,
        totalReviews: null,
        placeId: null,
        businessName: primaryQuery,
      },
      raw: null,
    };
  }
};

async function pickBestCandidate(candidates, domain, apiKey) {
  const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
  const normalizedDomain = normalizeDomainHost(domain);
  let best = null;

  for (const candidate of candidates) {
    if (!candidate?.place_id) continue;
    try {
      const detailsResponse = await requestWithRetry(detailsUrl, {
        place_id: candidate.place_id,
        fields: 'name,rating,user_ratings_total,website,formatted_address,business_status,types,url',
        key: apiKey,
      });
      const details = detailsResponse?.data?.result || {};
      const score = scoreCandidate(details, candidate, normalizedDomain);
      const entry = {
        ...candidate,
        details,
        matchScore: score,
      };
      if (!best || entry.matchScore > best.matchScore) {
        best = entry;
      }
    } catch (_error) {}
  }

  if (best) return best;
  return candidates[0] || null;
}

function scoreCandidate(details, candidate, normalizedDomain) {
  let score = 0;
  const websiteHost = normalizeDomainHost(details?.website || '');
  if (websiteHost && normalizedDomain && domainMatches(websiteHost, normalizedDomain)) score += 100;

  const candidateName = String(candidate?.name || '').toLowerCase();
  const domainLabel = String(normalizedDomain || '').split('.')[0];
  if (domainLabel && candidateName.includes(domainLabel)) score += 25;

  const reviews = Number(details?.user_ratings_total || 0);
  if (reviews > 0) score += Math.min(20, Math.round(reviews / 50));
  if (String(details?.business_status || '').toUpperCase() === 'OPERATIONAL') score += 10;
  return score;
}

function normalizeDomainHost(value) {
  if (!value) return '';
  try {
    const source = String(value).trim();
    const parsed = source.startsWith('http://') || source.startsWith('https://')
      ? new URL(source)
      : new URL(`https://${source}`);
    return String(parsed.hostname || '').replace(/^www\./i, '').toLowerCase();
  } catch (_error) {
    return String(value || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
  }
}

function domainMatches(a, b) {
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}
