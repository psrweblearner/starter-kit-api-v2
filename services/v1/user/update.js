'use strict';

const { User } = require('../../../models');
const AppError = require('../../../utils/AppError');

module.exports = async (req) => {
  const isAdmin = !!req.user?.role;
  const targetId = Number(req.params.id);
  const currentUserId = Number(req.user?.id);

  if (!isAdmin && currentUserId !== targetId) {
    throw new AppError('Forbidden: You can only update your own profile', 403);
  }

  const user = await User.findByPk(targetId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const payload = {
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    businessName: req.body.businessName,
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    state: req.body.state,
    city: req.body.city,
    country: req.body.country,
    pincode: req.body.pincode
  };

  // Only admin can set password via this endpoint.
  if (isAdmin && req.body.password) {
    payload.password = req.body.password;
  }

  // Avoid overwriting existing fields with undefined values.
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  await user.update(payload);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    businessName: user.businessName,
    addressLine1: user.addressLine1,
    addressLine2: user.addressLine2,
    state: user.state,
    city: user.city,
    country: user.country,
    pincode: user.pincode,
    updatedAt: user.updatedAt
  };
};
