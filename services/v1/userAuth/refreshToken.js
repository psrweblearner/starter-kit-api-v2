'use strict';

const { User, UserSession } = require('../../../models');
const jwt = require('jsonwebtoken');
const promisify = require('util').promisify;
const path = require('path');
const fs = require('fs');
const { generateFingerprint } = require('../../../helper/utils');

module.exports = async (req) => {
  let refreshToken = req.cookies.user_refresh_token;
  if (!refreshToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    refreshToken = req.headers.authorization.split(' ')[1];
  }

  if (!refreshToken) throw new Error('No refresh token provided');

  const internalSecret = req.headers['x-internal-secret'];
  const isInternalRequest = internalSecret && internalSecret === process.env.INTERNAL_SECRET;

  const publicKey = fs.readFileSync(path.join(__dirname, '../../../', process.env.JWT_PUBLIC_KEY_PATH), 'utf8');

  let decoded;
  try {
    decoded = await promisify(jwt.verify)(refreshToken, publicKey, { algorithms: ['RS256'] });
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }

  if (decoded.type !== 'REFRESH') throw new Error('Invalid token type');

  const currentFinger = generateFingerprint(req);
  if (!isInternalRequest && decoded.finger && decoded.finger !== currentFinger) {
    throw new Error('Device fingerprint mismatch');
  }

  const session = await UserSession.findOne({
    where: {
      userId: decoded.id,
      refreshToken,
      status: 1
    }
  });

  if (!session || new Date() > session.expiresAt) {
    if (session) await session.update({ status: 0 });
    throw new Error('Session expired or revoked');
  }

  const user = await User.findByPk(decoded.id);
  if (!user) throw new Error('User no longer exists');

  const token = await User.generateToken(user, currentFinger, 'ACCESS', '20m');
  return { token, refreshToken };
};
