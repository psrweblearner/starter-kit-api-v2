'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW AuthUserView AS
      SELECT 
          au.id AS adminUserId,
          au.firstName,
          au.lastName,
          au.email,
          au.mobile,
          au.profile,
          au.address,
          au.designation,
          au.about,
          au.status AS userStatus,
          r.id AS roleId,
          r.title AS roleTitle,
          r.status AS roleStatus,
          CASE 
            WHEN LOWER(r.title) = 'admin' THEN 'full' 
            ELSE aur.access 
          END AS roleAccess,
          sm.id AS pageId,
          sm.title AS pageTitle,
          sm.icon AS pageIcon,
          sm.slug AS pageSlug,
          sm.status AS pageStatus,
          CASE 
            WHEN LOWER(r.title) = 'admin' THEN '["create","read","update","delete","download"]' 
            ELSE p.actions 
          END AS pageActions,
          m.id AS menuId,
          m.title AS menuTitle,
          m.icon AS menuIcon,
          m.slug AS menuSlug,
          m.status AS menuStatus,
          sp.actions AS specialActions
      FROM AdminUsers au
      JOIN AdminUserRoles aur ON au.id = aur.adminUserId
      JOIN Roles r ON aur.roleId = r.id
      LEFT JOIN Permissions p ON r.id = p.roleId
      -- Advanced Join: If Admin, join ALL active SubMenus. If not, join only assigned SubMenus.
      JOIN SubMenus sm ON (
          (LOWER(r.title) = 'admin') 
          OR 
          (p.pageId = sm.id)
      )
      LEFT JOIN MenuSubMenus msm ON sm.id = msm.subMenuId
      LEFT JOIN Menus m ON msm.menuId = m.id
      LEFT JOIN SpecialPermission sp ON au.id = sp.adminUserId AND r.id = sp.roleId AND sm.id = sp.pageId
      WHERE au.status = 1 
        AND r.status = 1 
        AND sm.status = 1 
        AND (m.status = 1 OR m.id IS NULL);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS AuthUserView`);
  }
};
