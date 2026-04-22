'use strict';
const jwt = require("jsonwebtoken");
const promisify = require("util").promisify;
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.identify = catchAsync(async (req, res, next) => {
  const cookieToken = req.cookies.user_auth_token;
  const headerToken = extractBearerToken(req);
  const token = cookieToken || headerToken;

  if (token) {
    try {
      const fs = require('fs');
      const path = require('path');
      const publicKey = fs.readFileSync(path.join(__dirname, '../', process.env.JWT_PUBLIC_KEY_PATH), 'utf8');

      const payload = await promisify(jwt.verify)(token, publicKey, { algorithms: ['RS256'] });
      if (payload && payload.type === 'ACCESS') {
        const { generateFingerprint } = require('../helper/utils');
        const currentFinger = generateFingerprint(req);
        const internalSecret = req.headers['x-internal-secret'];
        const isInternalRequest = internalSecret && internalSecret === process.env.INTERNAL_SECRET;

        if (payload.finger && payload.finger !== currentFinger && !isInternalRequest) {
          req.user = undefined;
        } else {
          req.user = payload;
        }
      }
    } catch (err) {
      req.user = undefined;
    }
  }
  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  const cookieToken = req.cookies.user_auth_token;
  const headerToken = extractBearerToken(req);
  const token = cookieToken || headerToken;
  if (!token) return next(new AppError('Unauthorized', 401));

  try {
    const fs = require('fs');
    const path = require('path');
    const publicKey = fs.readFileSync(path.join(__dirname, '../', process.env.JWT_PUBLIC_KEY_PATH), 'utf8');
    const payload = await promisify(jwt.verify)(token, publicKey, { algorithms: ['RS256'] });

    if (!payload || payload.type !== 'ACCESS') {
      return next(new AppError('Unauthorized', 401));
    }

    const { generateFingerprint } = require('../helper/utils');
    const currentFinger = generateFingerprint(req);
    const internalSecret = req.headers['x-internal-secret'];
    const isInternalRequest = internalSecret && internalSecret === process.env.INTERNAL_SECRET;

    if (payload.finger && payload.finger !== currentFinger && !isInternalRequest) {
      return next(new AppError('Unauthorized', 401));
    }

    req.user = payload;
    next();
  } catch (err) {
    return next(new AppError('Unauthorized', 401));
  }
});

function extractBearerToken(req) {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}
