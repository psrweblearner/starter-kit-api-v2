'use strict';

const { User } = require('../../../models');
const AppError = require('../../../utils/AppError');

module.exports = async (req) => {
  const isAdmin = !!req.user?.role;
  if (!isAdmin) {
    throw new AppError('Forbidden: Only admins can view all users', 403);
  }

  const users = await User.findAll({
    attributes: [
      'id',
      'name',
      'email',
      'mobile',
      'businessName',
      'addressLine1',
      'addressLine2',
      'state',
      'city',
      'country',
      'pincode',
      'createdAt',
      'updatedAt'
    ],
    order: [['id', 'DESC']]
  });

  return users;
};
