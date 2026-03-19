'use strict';
const { Op } = require("sequelize");

/**
 * Apply extraWhere and includeWhere conditions to queryConfig
 * @param {Object} queryConfig - Sequelize query configuration (from buildQuery)
 * @param {Object} extraWhere - Root-level where
 * @param {Object} includeWhere - Nested include where conditions (dot-path alias)
 */
function applyWhere(queryConfig, extraWhere, includeWhere) {
  // ---------------- Root extraWhere ----------------
  if (extraWhere && Object.keys(extraWhere).length) {
    queryConfig.where = queryConfig.where && Object.keys(queryConfig.where).length
      ? { [Op.and]: [queryConfig.where, extraWhere] }
      : extraWhere;
  }

  // ---------------- Include-level where ----------------
  if (includeWhere && typeof includeWhere === 'object') {
    for (const path in includeWhere) {
      const cond = includeWhere[path];
      if (!cond) continue;

      const parts = path.split('.');
      let currentIncludes = queryConfig.include;
      let includeDef = null;

      for (const alias of parts) {
        includeDef = (currentIncludes || []).find(i => i.as === alias);
        if (!includeDef) { includeDef = null; break; }
        if (!includeDef.include) includeDef.include = [];
        currentIncludes = includeDef.include;
      }

      if (includeDef) {
        includeDef.where = includeDef.where
          ? { [Op.and]: [includeDef.where, cond] }
          : cond;
      }
    }
  }
}
module.exports = { applyWhere };