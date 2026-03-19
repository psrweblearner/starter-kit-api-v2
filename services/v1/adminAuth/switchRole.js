'use strict';

const { generateFingerprint } = require('../../../helper/utils');
const { AdminUser, Role, AdminUserRole } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
module.exports = async (req) => {
    const { userId, roleId } = req.body;
    const where = { id: userId, status: 1 };
    const user = await findOneUser(req, where, 'adminAuth');
    if (!user || !user.roles || user.roles.length === 0) throw new Error('Invalid user or user has no role assigned');
    const finger = generateFingerprint(req);
    const role = user.roles;
    const activeRole = user.roles.find(r => r.id == roleId);
    if (!activeRole) throw new Error('User does not have the specified role');

    // 1. Access Token (Short - 10m)
    const token = await AdminUser.generateToken(user, activeRole, role, finger, 'ACCESS', '20m');

    // 2. Refresh Token (Long - 7d)
    const refreshToken = await AdminUser.generateToken(user, activeRole, role, finger, 'REFRESH', '7d');

    // 3. Save Session
    const { AdminSession } = require('../../../models');
    await AdminSession.create({
        adminUserId: user.id,
        refreshToken,
        finger,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { login: true, token, refreshToken };
};

const findOneUser = async (req, where, key) => {
    const { data } = await detailQuery(AdminUser, req, null, {
        defaultAttributes: ["id", "firstName", "lastName", "email", "mobile", "profile", "address", "designation", "about", "password"],
        where,
        defaultIncludes: [
            {
                model: Role,
                as: 'roles',
                attributes: ['id', 'title', 'status'],
                through: { model: AdminUserRole, attributes: ['access'] },
            },
        ],
    });

    const user = data?.data;
    return user;
};