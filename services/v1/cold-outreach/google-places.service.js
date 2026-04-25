'use strict';

const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: Number(process.env.COLD_OUTREACH_CACHE_TTL_SEC || 3600) });
const RATE_LIMIT_MS = Number(process.env.COLD_OUTREACH_GOOGLE_RATE_LIMIT_MS || 250);
let lastCallAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimitedGet(url, params, cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const wait = Math.max(0, RATE_LIMIT_MS - (Date.now() - lastCallAt));
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();

  const response = await axios.get(url, { params, timeout: 15000 });
  cache.set(cacheKey, response.data);
  return response.data;
}

async function textSearch(query, pageToken = null) {
  const key = process.env.GOOGLE_MAP_KEY;
  const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const params = pageToken ? { pagetoken: pageToken, key } : { query, key };
  const cacheKey = `text:${query}:${pageToken || 'first'}`;
  return rateLimitedGet(url, params, cacheKey);
}

async function placeDetails(placeId) {
  const key = process.env.GOOGLE_MAP_KEY;
  const url = 'https://maps.googleapis.com/maps/api/place/details/json';
  const params = {
    place_id: placeId,
    key,
    fields: [
      'name',
      'formatted_address',
      'rating',
      'user_ratings_total',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'business_status',
    ].join(','),
  };
  const cacheKey = `details:${placeId}`;
  return rateLimitedGet(url, params, cacheKey);
}

async function fetchAllTextResults(query) {
  const all = [];
  let token = null;
  for (let page = 0; page < 3; page += 1) {
    const payload = await textSearch(query, token);
    const results = Array.isArray(payload?.results) ? payload.results : [];
    all.push(...results);
    token = payload?.next_page_token || null;
    if (!token) break;
    await sleep(1800);
  }
  return all;
}

module.exports = {
  fetchAllTextResults,
  placeDetails,
};
