'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   const desired =[{
    id:1,title:'Admin',status:1
   }];
   const existing = await queryInterface.sequelize.query("SELECT * FROM Roles;", {type:queryInterface.sequelize.QueryTypes.SELECT});
   const have = new Set(existing.map(r=> r.title));
   const now = new Date();
   const toInsert = desired.filter(u => !have.has(u.title)).map(u => ({ ...u, createdBy:"system",modifyBy:null,createdAt:now,updatedAt:now}));
   if(toInsert.length){
    await queryInterface.bulkInsert('Roles', toInsert,{});
   }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles',null, {});
  }
};
