'use strict';

const { AdminUser, AdminSession, Role, AdminUserRole } = require('../../../models');
const jwt = require('jsonwebtoken');
const promisify = require('util').promisify;
const path = require('path');
const fs = require('fs');
const { generateFingerprint } = require('../../../helper/utils');

module.exports = async (req) => {
    let refreshToken = req.cookies.admin_refresh_token;
    console.log(req.headers.authorization, 'req.headers.authorization');
    // Fallback: Check Authorization Header if cookie is missing (server-to-server)
    if (!refreshToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        refreshToken = req.headers.authorization.split(' ')[1];
    }

    console.log('[DEBUG] Refresh Token Request', {
        hasToken: !!refreshToken,
        cookies: req.cookies ? Object.keys(req.cookies) : 'none',
        hasAuthHeader: !!req.headers.authorization
    });

    if (!refreshToken) throw new Error('No refresh token provided');

    const internalSecret = req.headers['x-internal-secret'];
    const isInternalRequest = internalSecret && internalSecret === process.env.INTERNAL_SECRET;

    // 1. Load Public Key
    const publicKey = fs.readFileSync(path.join(__dirname, '../../../', process.env.JWT_PUBLIC_KEY_PATH), 'utf8');

    // 2. Verify Refresh Token
    let decoded;
    try {
        decoded = await promisify(jwt.verify)(refreshToken, publicKey, { algorithms: ['RS256'] });
    } catch (err) {
        console.log('[DEBUG] Token Verification Failed', err.message);
        throw new Error('Invalid or expired refresh token');
    }

    if (decoded.type !== 'REFRESH') throw new Error('Invalid token type');

    // 3. Compute Fingerprint
    // Use the centralized helper which now uses User-Agent for network stability.
    // The ADMIN server ALWAYS forwards the original client User-Agent.
    const currentFinger = generateFingerprint(req);

    console.log('[DEBUG] Fingerprint Check', {
        decodedFinger: decoded.finger,
        currentFinger: currentFinger,
        match: decoded.finger === currentFinger,
        isInternal: isInternalRequest
    });

    // Skip fingerprint enforcement for internal server-to-server requests
    if (!isInternalRequest && decoded.finger && decoded.finger !== currentFinger) {
        throw new Error('Device fingerprint mismatch');
    }

    // 4. Check Session in Database
    const session = await AdminSession.findOne({
        where: {
            adminUserId: decoded.id,
            refreshToken,
            status: 1
        }
    });

    if (!session || new Date() > session.expiresAt) {
        console.log('[DEBUG] Session Invalid', {
            found: !!session,
            expired: session ? (new Date() > session.expiresAt) : 'N/A'
        });
        if (session) await session.update({ status: 0 }); // Revoke if expired
        throw new Error('Session expired or revoked');
    }

    // 5. Fetch Full User Data to regenerate Access Token
    const user = await AdminUser.findByPk(decoded.id, {
        include: [{
            model: Role,
            as: 'roles',
            through: { model: AdminUserRole },
            where: { id: decoded.role.id } // The role active in the refresh token
        }]
    });

    if (!user) throw new Error('User no longer exists');
    const activeRole = user.roles[0];

    // 6. Issue New Access Token — stamped with the real client IP fingerprint
    const token = await AdminUser.generateToken(user, activeRole, false, currentFinger, 'ACCESS', '20m');

    // Return both tokens so the ADMIN bridge can re-set admin_refresh_token
    // on the ADMIN domain (not just the access token).
    return { token, refreshToken };
};
