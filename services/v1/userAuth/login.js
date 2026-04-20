'use strict';

const { User, UserSession } = require('../../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { detailQuery } = require('../../../utils/build_query');
const { generateFingerprint } = require('../../../helper/utils');

module.exports = async (req) => {
  const { username, password } = req.body;

  const where = {
    [Op.or]: [{ email: username }, { mobile: username }]
  };

  const user = await findOneUser(req, where);
  if (!user) throw new Error('Invalid email/mobile or password');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error('Invalid email/mobile or password');

  const finger = generateFingerprint(req);
  const token = await User.generateToken(user, finger, 'ACCESS', '20m');
  const refreshToken = await User.generateToken(user, finger, 'REFRESH', '30d');

  await UserSession.create({
    userId: user.id,
    refreshToken,
    finger,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  return {
    login: true,
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    }
  };
};


const findOneUser = async (req, where) => {
  const { data } = await detailQuery(User, req, null, {
    defaultAttributes: ["id", "name", "email", "mobile", "password"],
    where
  });
  const user = data?.data;
  return user;
};