'use strict';

const axios = require('axios');

module.exports = async ({ domain, businessName }) => {
  const startedAt = Date.now();
  const apiKey = process.env.GOOGLE_MAP_KEY;
  const query = String(businessName || domain || '').trim();

  if (!apiKey) {
    return {
      status: 'skipped',
      elapsedMs: Date.now() - startedAt,
      error: 'GOOGLE_MAP_KEY is missing',
      data: null,
      raw: null,
    };
  }

  if (!query) {
    return {
      status: 'skipped',
      elapsedMs: Date.now() - startedAt,
      error: 'No businessName/domain provided for Maps lookup',
      data: null,
      raw: null,
    };
  }

  try {
    const textSearchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const searchResponse = await axios.get(textSearchUrl, {
      timeout: 12000,
      params: {
        query,
        key: apiKey,
      },
    });

    const best = searchResponse.data?.results?.[0];
    if (!best?.place_id) {
      return {
        status: 'completed',
        elapsedMs: Date.now() - startedAt,
        data: {
          rating: null,
          totalReviews: null,
          placeId: null,
          businessName: query,
        },
        raw: {
          textSearch: searchResponse.data || null,
          placeDetails: null,
        },
      };
    }

    const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const detailsResponse = await axios.get(detailsUrl, {
      timeout: 12000,
      params: {
        place_id: best.place_id,
        fields: 'name,rating,user_ratings_total',
        key: apiKey,
      },
    });

    const details = detailsResponse.data?.result || {};
    return {
      status: 'completed',
      elapsedMs: Date.now() - startedAt,
      data: {
        rating: details.rating ?? null,
        totalReviews: details.user_ratings_total ?? null,
        placeId: best.place_id,
        businessName: details.name || query,
      },
      raw: {
        textSearch: searchResponse.data || null,
        placeDetails: detailsResponse.data || null,
      },
    };
  } catch (error) {
    return {
      status: 'failed',
      elapsedMs: Date.now() - startedAt,
      error: error?.message || 'Google Maps lookup failed',
      data: null,
      raw: null,
    };
  }
};
