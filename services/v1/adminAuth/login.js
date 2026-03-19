'use strict';

const { AdminUser, Role, AdminUserRole } = require('../../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { detailQuery } = require('../../../utils/build_query');

module.exports = async (req) => {
  const { username, password } = req.body;

  const where = {
    [Op.or]: [{ email: username }, { mobile: username }],
    status: 1,
  };

  const user = await findOneUser(req, where, 'adminAuth');
  if (!user) throw new Error('Invalid email/mobile or password');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error('Invalid email/mobile or password');

  const roleCount = user.roles.length;
  if (roleCount === 0) throw new Error('User has no role assigned');

  // ✅ SINGLE ROLE → AUTO LOGIN
  if (roleCount === 1) {
    const activeRole = user.roles[0];

    // Fetch Menus (Groups) for this role
    const { generateFingerprint } = require('../../../helper/utils');

    const finger = generateFingerprint(req);
    // 1. Access Token (Short - 20m)
    const token = await AdminUser.generateToken(user, activeRole, false, finger, 'ACCESS', '20m');

    // 2. Refresh Token (Long - 30d)
    const refreshToken = await AdminUser.generateToken(user, activeRole, false, finger, 'REFRESH', '30d');

    // 3. Save Session
    const { AdminSession } = require('../../../models');
    await AdminSession.create({
      adminUserId: user.id,
      refreshToken,
      finger,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days
    });

    return { login: true, token, refreshToken };
  }

  // ✅ MULTIPLE ROLES → ASK USER TO SELECT ROLE
  return { multipleRoles: true, user: { id: user.id }, roles: user.roles.map(role => ({ id: role.id, title: role.title, })), };
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