'use strict';
const db = require('../../../models');
const {Otp,AdminUser} = db;
const { Op } = require('sequelize');
const { detailQuery } = require('../../../utils/build_query');
const { generateOTP } = require('../../../helper/utils');
const NOT_SENT_MESSAGE = 'OTP not sent. Username is invalid or you are no longer assigned to admin.';

module.exports = async (req) => {
  try {
    const username = String(req.body.username || '').trim();
    const where = {
      [Op.or]: [{ email: username }, { mobile: username }],
      status: 1,
    };

    const user = await findOneUser(req, where);
    if (!user) {
      return { sent: false, message: NOT_SENT_MESSAGE };
    }

    const contactWhere = buildContactWhere(user);
    if (contactWhere) {
      await Otp.update(
        { status: 0 },
        {
          where: {
            [Op.or]: contactWhere,
            type: 'admin-forget-password',
            status: 1
          }
        }
      );
    }

    const { otp, expiresIn } = await generateOTP(6, 10, 'number');
    await Otp.create({
      name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null,
      email: user.email,
      mobile: user.mobile,
      otp,
      type: 'admin-forget-password',
      status: 1,
      expire: new Date(Date.now() + expiresIn * 1000)
    });

    return {
      sent: true,
      message: 'OTP has been sent to your registered email or mobile number.'
    };
  } catch (err) {
    return {
      sent: false,
      message: NOT_SENT_MESSAGE
    };
  }
};


const findOneUser = async (req, where) => {
  const { data } = await detailQuery(AdminUser, req, null, {
    defaultAttributes: ["id", "firstName", "lastName", "email", "mobile"],
    where,
  });
  const user = data?.data;
  return user;
};

const buildContactWhere = (user) => {
  const contactWhere = [];
  if (user?.email) contactWhere.push({ email: user.email });
  if (user?.mobile) contactWhere.push({ mobile: user.mobile });
  return contactWhere.length ? contactWhere : null;
};
