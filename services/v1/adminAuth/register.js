'use strict';
const db = require('../../../models');
const { AdminUser } = db;
module.exports = async (req) => {
  const { firstName, lastName, email,mobile,designation,about,address,profile} = req.body;
  const user = req.user?.id || 'system';
  await AdminUser.create({firstName,lastName,email,mobile,designation,about,profile,address,createdBy:user});
  return;
};
