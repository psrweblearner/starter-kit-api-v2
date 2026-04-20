'use strict';
const db = require('../../../models');
const { User } = db;
module.exports = async (req) => {
  const { name, email,mobile,password} = req.body;
  await User.create({name, email,mobile,password});
  return;
};
