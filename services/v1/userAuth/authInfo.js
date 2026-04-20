'use strict';

const { User } = require('../../../models');

module.exports = async (req) => {
  if (!req.user?.id) throw new Error('Unauthorized');

  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'mobile', 'businessName', 'addressLine1', 'addressLine2', 'state', 'city', 'country', 'pincode']
  });

  if (!user) throw new Error('User not found');
  return user;
};
