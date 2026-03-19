'use strict';

const { buildQuery } = require('./buildQuery');
const { parseColumns } = require('./parseColumns');
const { getIncludeList } = require('./getIncludeList');
const { hydrateFileFields } = require('./hydrateFiles');
const { hydrateUserFields } = require('./hydrateUsers');
const { hydrateEditorDescriptionForEdit } = require('./hydrateEditor');
const { applyWhere } = require('./applyWhere');
const cache = require('../cacheManager');

/**
 * Generic fetch helper for any model with columns, protected fields, pagination, cache, etc.
 *
 * @param {Sequelize.Model} model - Sequelize model to query
 * @param {Object} req - Express req object
 * @param {String} cacheKey - Key prefix for caching
 * @param {Object} options - { defaultAttributes, protectedFields, defaultIncludes, mode }
 */
async function listQuery(model, req, key, options = {}) {
  const { defaultAttributes = [], protectedFields = [], defaultIncludes = [], where: extraWhere, includeWhere, fileFields = [], userFields = [], raw = false, order: extraOrder } = options;

  // ------------------ Cache ------------------
  let cachedData = null;
  let sourceName = 'db';
  if (key) {
    const { data, name } = await cache.getCache(req, key);
    cachedData = data;
    sourceName = name;
    if (cachedData) return { data: cachedData, name: sourceName };
  }
  // ------------------ Columns ------------------
  //   const userColumns = req.query.columns?.split(",").filter(Boolean);
  const userColumns = parseColumns(req.query, protectedFields, defaultAttributes);
  // console.log('userColumns:', userColumns);
  // ------------------ Include ------------------
  const include = getIncludeList(req.query?.columns, userColumns, defaultIncludes);

  const queryConfig = buildQuery(req.query, { include, userColumns });

  // Avoid over-counting when joins create duplicate rows (e.g., many-to-many includes)
  queryConfig.distinct = true;
  if (!queryConfig.col && model && model.primaryKeyAttribute) {
    queryConfig.col = model.primaryKeyAttribute;
  }

  // Apply programmatic order if provided (overrides query string order)
  if (extraOrder && extraOrder.length) {
    queryConfig.order = extraOrder;
  }

  // Merge extra root where if provided programmatically
  applyWhere(queryConfig, extraWhere, includeWhere);
  // ------------------ Execute ------------------
  let count, rows, plainRows;
  if (raw) {
    // Use direct SQL selection to ensure all columns (including dynamic view columns) are returned
    const qi = model.sequelize.getQueryInterface();
    const qg = qi.queryGenerator;
    const qc = { ...queryConfig };
    // Let the generator select all columns; avoid model attributes-only selection
    delete qc.attributes;
    const sqlRows = qg.selectQuery(model.getTableName(), qc, model);
    rows = await model.sequelize.query(sqlRows, { type: model.sequelize.QueryTypes.SELECT });
    // Preserve distinct counting semantics
    count = await model.count({ ...queryConfig, distinct: true, col: queryConfig.col || model.primaryKeyAttribute });
    plainRows = rows;
  } else {
    const result = await model.findAndCountAll(queryConfig);
    count = result.count;
    rows = result.rows;
    plainRows = rows.map(r => r.get({ plain: true }));
  }

  // Recursive hydration function for nested includes
  const hydrateNestedData = async (data, includes = []) => {
    if (!data) return data;

    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      // Process each include
      for (const inc of includes) {
        const nestedData = item[inc.as];
        if (!nestedData) continue;

        // Hydrate editDesc for this include
        if (inc.editDesc && nestedData[inc.editDesc]) {
          const items = Array.isArray(nestedData) ? nestedData : [nestedData];
          for (const nestedItem of items) {
            if (nestedItem[inc.editDesc]) {
              const hydrated = await hydrateEditorDescriptionForEdit(nestedItem[inc.editDesc]);
              nestedItem[inc.editDesc] = JSON.stringify(hydrated);
            }
          }
        }

        // Hydrate fileFields for this include
        if (inc.fileFields && inc.fileFields.length) {
          const hydrated = await hydrateFileFields(nestedData, inc.fileFields);
          if (Array.isArray(nestedData)) {
            item[inc.as] = hydrated;
          } else {
            item[inc.as] = hydrated;
          }
        }

        // Hydrate userFields for this include
        if (inc.userFields && inc.userFields.length) {
          const hydrated = await hydrateUserFields(nestedData, inc.userFields);
          item[inc.as] = hydrated;
        }

        // Recursively process nested includes
        if (inc.include && inc.include.length) {
          await hydrateNestedData(nestedData, inc.include);
        }
      }
    }

    return Array.isArray(data) ? items : items[0];
  };

  // Hydrate parent file fields
  const fieldsToHydrate = fileFields.filter(f => userColumns.positive.includes(f));

  if (fieldsToHydrate.length) {
    plainRows = await hydrateFileFields(plainRows, fieldsToHydrate);
  }

  // Hydrate parent user fields
  if (userFields && userFields.length) {
    plainRows = await hydrateUserFields(plainRows, userFields);
  }

  // Hydrate nested includes
  if (defaultIncludes && defaultIncludes.length) {
    plainRows = await hydrateNestedData(plainRows, defaultIncludes);
  }

  const response = { status: true, total: count, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10, data: plainRows };
  // TTL can be passed via req.query.ttl (in seconds). If omitted, default from NodeCache is used.
  if (key) {
    const ttlSeconds = req.query && req.query.ttl ? parseInt(req.query.ttl) : undefined;
    // Fire and forget (don't await)
    cache.setCache(req, key, response, ttlSeconds).catch(err => {
      logger.error('Background Cache Set Failed', err);
    });
  }
  return { data: response, name: sourceName };
};
module.exports = { listQuery };