'use strict';
const jwt = require("jsonwebtoken");
const promisify = require("util").promisify;
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

/**
 * User Identification Middleware (Global)
 * Attempts to set req.user if a token is present, but never blocks the request.
 */
exports.identify = catchAsync(async (req, res, next) => {
    const token = req.cookies.admin_auth_token;

    if (token) {
        try {
            const fs = require('fs');
            const path = require('path');
            const publicKey = fs.readFileSync(path.join(__dirname, '../', process.env.JWT_PUBLIC_KEY_PATH), 'utf8');

            const payload = await promisify(jwt.verify)(token, publicKey, { algorithms: ['RS256'] });
            if (payload) {
                const { generateFingerprint } = require('../helper/utils');
                const currentFinger = generateFingerprint(req);
                const internalSecret = req.headers['x-internal-secret'];
                const isInternalRequest = internalSecret && internalSecret === process.env.INTERNAL_SECRET;

                if (payload.finger && payload.finger !== currentFinger && !isInternalRequest) {
                    req.user = undefined; // Fingerprint mismatch
                } else {
                    req.user = payload;
                }
            }
        } catch (err) {
            console.log('[API Identify] Token Verify Failed:', err.message); // DEBUG
            // Invalid token - clear req.user to be safe
            req.user = undefined;
        }
    } else {
        console.log('[API Identify] No Token Provided'); // DEBUG
    }
    next();
});

/**
 * Access Enforcement Middleware (Route Group)
 * Blocks the request if req.user is missing (401 Unauthorized).
 */
exports.protect = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Unauthorized', 401));
    }
    next();
});