'use strict';

const bcrypt = require('bcryptjs');
const db = require('../../../models');
const { Otp, AdminUser, AdminSession } = db;
const { Op } = require('sequelize');
const { detailQuery } = require('../../../utils/build_query');

module.exports = async (req) => {
  const username = String(req.body.username || '').trim();
  const otp = String(req.body.otp || '').trim();
  const password = String(req.body.password || '').trim();

  if (!username || !otp || !password) {
    throw new Error('Username, OTP and password are required');
  }

  const user = await findOneUser(req, {
    [Op.or]: [{ email: username }, { mobile: username }],
    status: 1
  });

  if (!user) {
    throw new Error('Invalid OTP or request expired');
  }

  const record = await findOtpRecord(user, otp);
  if (!record) {
    throw new Error('Invalid OTP or request expired');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await AdminUser.update(
    { password: hashedPassword, pwd: password },
    { where: { id: user.id } }
  );

  const contactWhere = [];
  if (user?.email) contactWhere.push({ email: user.email });
  if (user?.mobile) contactWhere.push({ mobile: user.mobile });

  if (contactWhere.length) {
    await Otp.update(
      { status: 0 },
      {
        where: {
          [Op.or]: contactWhere,
          type: 'admin-forget-password'
        }
      }
    );
  }

  await AdminSession.update(
    { status: 0 },
    { where: { adminUserId: user.id, status: 1 } }
  );

  return { reset: true };
};

const findOneUser = async (req, where) => {
  const { data } = await detailQuery(AdminUser, req, null, {
    defaultAttributes: ['id', 'email', 'mobile'],
    where,
  });
  return data?.data;
};

const findOtpRecord = async (user, otp) => {
  const contactWhere = [];
  if (user?.email) contactWhere.push({ email: user.email });
  if (user?.mobile) contactWhere.push({ mobile: user.mobile });

  if (!contactWhere.length) return null;

  return Otp.findOne({
    where: {
      [Op.or]: contactWhere,
      otp,
      type: 'admin-forget-password',
      status: 1,
      expire: { [Op.gt]: new Date() }
    },
    order: [['createdAt', 'DESC']]
  });
};
