'use strict';

const { User } = require('../../../models');
const AppError = require('../../../utils/AppError');

module.exports = async (req) => {
  const isAdmin = !!req.user?.role;
  if (!isAdmin) {
    throw new AppError('Forbidden: Only admins can create users here', 403);
  }

  const {
    name,
    email,
    mobile,
    password,
    businessName,
    addressLine1,
    addressLine2,
    state,
    city,
    country,
    pincode
  } = req.body;

  const created = await User.create({
    name,
    email,
    mobile,
    password,
    businessName,
    addressLine1,
    addressLine2,
    state,
    city,
    country,
    pincode
  });

  return {
    id: created.id,
    name: created.name,
    email: created.email,
    mobile: created.mobile
  };
};
