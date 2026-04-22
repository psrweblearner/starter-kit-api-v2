'use strict';

const { ApiClient } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// In-memory cache (1 minute)
let clientCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 1000;

// Normalize domain (https://example.com/ -> example.com)
const normalizeDomain = (value) => {
    if (!value) return '';
    return value
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase();
};

module.exports = async function apiProtection(req, res, next) {
    try {
        const isPublicSitemapAutomationRoute = String(req.path || '').startsWith('/v1/sitemap-automation/public/');
        if (isPublicSitemapAutomationRoute) {
            if (req.headers.origin) {
                res.header('Access-Control-Allow-Origin', req.headers.origin);
                res.header('Access-Control-Allow-Credentials', 'true');
            } else {
                res.header('Access-Control-Allow-Origin', '*');
            }
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-Requested-With');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            return next();
        }

        const origin = req.headers.origin || '';
        const referer = req.headers.referer || '';
        const host = req.headers.host || '';
        const apiKey = req.headers['x-api-key'];
        const internalSecret = req.headers['x-internal-secret'];
        const requestDomain =
            normalizeDomain(origin) ||
            normalizeDomain(referer.split('/').slice(0, 3).join('/')) ||
            normalizeDomain(host);

        /* --------------------------------------------------
         * 0. Internal Request Bypass (Admin → API)
         * -------------------------------------------------- */
        if (internalSecret && internalSecret === process.env.INTERNAL_SECRET) {
            req.isInternal = true;
            return next();
        }

        /* --------------------------------------------------
         * 1. Refresh Client Cache (Fail-safe)
         * -------------------------------------------------- */
        const now = Date.now();

        if (!clientCache || (now - lastCacheUpdate > CACHE_TTL)) {
            try {
                clientCache = await ApiClient.findAll({
                    where: { status: 1 },
                    raw: true
                });
                lastCacheUpdate = now;
            } catch (err) {
                logger.error('API Protection: DB Error', err);
                if (!clientCache) {
                    return next(new AppError('Service unavailable', 503));
                }
            }
        }

        /* --------------------------------------------------
         * 2. Resolve Client (Exact Domain > Wildcard)
         * -------------------------------------------------- */

        // DEFAULT OPEN STRATEGY: If DB is empty, allow EVERYTHING
        let activeClient = null;

        if (!clientCache || clientCache.length === 0) {
            activeClient = {
                domain: '0.0.0.0', // Wildcard
                allow_all: true,   // No API Key needed
                api_key: null
            };
        } else {
            activeClient =
                clientCache.find(c => normalizeDomain(c.domain) === requestDomain) ||
                clientCache.find(c => c.domain === '0.0.0.0' || !c.domain);
        }

        if (!activeClient) {
            throw new AppError('Domain not allowed', 403);
        }

        /* --------------------------------------------------
         * 3. CORS Handling
         * -------------------------------------------------- */
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Credentials', 'true');
        }

        res.header(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, x-api-key, X-Requested-With'
        );
        res.header(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        );

        // Preflight request
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }

        /* --------------------------------------------------
         * 4. API Key Validation
         * -------------------------------------------------- */
        // allow_all = 1 → No key required
        // allow_all = 0 → Key required
        if (!activeClient.allow_all) {
            if (!apiKey || apiKey !== activeClient.api_key) {
                throw new AppError('Invalid or missing API key', 403);
            }
        }

        /* --------------------------------------------------
         * 5. Attach Client Info & Continue
         * -------------------------------------------------- */
        req.apiClient = activeClient;
        return next();

    } catch (err) {
        return next(err);
    }
};