'use strict';

const { User } = require('../../../models');
const AppError = require('../../../utils/AppError');

module.exports = async (req) => {
  const isAdmin = !!req.user?.role;
  const targetId = Number(req.params.id);
  const currentUserId = Number(req.user?.id);

  if (!isAdmin && currentUserId !== targetId) {
    throw new AppError('Forbidden: You can only view your own profile', 403);
  }

  const user = await User.findByPk(targetId, {
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
    ]
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};
