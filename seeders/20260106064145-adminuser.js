'use strict';
const bcrypt = require('bcryptjs');
const {uniqueId} = require('../helper/utils');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
  const pass = await bcrypt.hash('123456789', 10);
  const userCode = uniqueId(8);
  const desired = [{
    id:1,
    firstName:'Pushkar',
    lastName:'Singh Rawat',
    userCode,
    slug:'pushkar-singh-rawat',
    email:'singhpushkar44@gmail.com',
    password:pass,
    pwd:'123456789',
    mobile:'8447459230',
    designation:'Web Developer',
    is_agent:0,
    license:'Admin License',
    status:1,
    is_verify:1,
    order:1,
    createdBy:'System',
    modifyBy:'System'
  }];
  const existing = await queryInterface.sequelize.query("SELECT * FROM AdminUsers;", {type:queryInterface.sequelize.QueryTypes.SELECT});
  const have = new Set(existing.map(r=> r.email));
  const now = new Date();
  const toInsert = desired.filter(u => !have.has(u.email)).map(u => ({ ...u, createdBy:"system",modifyBy:null,createdAt:now,updatedAt:now}));
  if(toInsert.length){
    await queryInterface.bulkInsert('AdminUsers', toInsert,{});
  }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AdminUsers',null, {});
  }
};
