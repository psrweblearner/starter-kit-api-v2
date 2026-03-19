'use strict';

const models = require("../../models");

const SYSTEM_USER = {
  id: 0,
  name: 'System',
  email: null
};

/**
 * Hydrate `createdBy` and `modifiedBy` fields with user info
 * @param {Object|Array} records
 * @param {Array} userFields - fields to hydrate e.g. ['createdBy', 'modifiedBy']
 */
const hydrateUserFields = async (records, userFields = []) => {
  if (!records || !userFields.length) return records;

  const rows = Array.isArray(records) ? records : [records];

  // Collect all user IDs that need hydration (ignore 0 / null)
  const userIds = new Set();
  rows.forEach(r => {
    userFields.forEach(f => {
      if (r[f] && Number(r[f]) > 0) {
        userIds.add(r[f]);
      }
    });
  });

  // Fetch users only if needed
  let userMap = {};
  if (userIds.size) {
    const users = await models.AdminUser.findAll({
      where: { id: Array.from(userIds) },
      attributes: ["id", "firstName", "lastName", "email"]
    });

    userMap = Object.fromEntries(
      users.map(u => [
        u.id,
        {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email
        }
      ])
    );
  }

  // Hydrate records
  rows.forEach(r => {
    userFields.forEach(f => {
      const uid = r[f];

      // Replace ID with user object or system fallback
      r[f] = uid && userMap[uid]
        ? userMap[uid]
        : SYSTEM_USER;
    });
  });

  return Array.isArray(records) ? rows : rows[0];
};

module.exports = { hydrateUserFields };
