'use strict';

const { Otp, AdminUser } = require('../../../models');
const { Op } = require('sequelize');
const { detailQuery } = require('../../../utils/build_query');

module.exports = async (req) => {
  const username = String(req.body.username || '').trim();
  const otp = String(req.body.otp || '').trim();

  if (!username || !otp) {
    throw new Error('Username and OTP are required');
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

  return { verified: true };
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
