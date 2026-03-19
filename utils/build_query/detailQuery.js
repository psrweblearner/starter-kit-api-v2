'use strict';

const { buildQuery } = require('./buildQuery');
const { parseColumns } = require('./parseColumns');
const { getIncludeList } = require('./getIncludeList');
const { hydrateEditorDescriptionForEdit } = require('./hydrateEditor');
const { hydrateFileFields } = require('./hydrateFiles');
const { hydrateUserFields } = require('./hydrateUsers');
const { applyWhere } = require('./applyWhere');
const cache = require('../cacheManager');

/**
 * Recursive hydration helper
 */
const performHydration = async (data, options = {}, userColumns = { positive: [] }) => {
  if (!data) return data;

  const isArray = Array.isArray(data);
  const records = isArray ? data : [data];

  const { editDesc, fileFields = [], userFields = [], include = [] } = options;

  for (let record of records) {
    // 1. Hydrate Editor Description
    if (editDesc && record[editDesc]) {
      const hydrated = await hydrateEditorDescriptionForEdit(record[editDesc]);
      record[editDesc] = JSON.stringify(hydrated);
    }

    // 2. Hydrate File Fields
    const fieldsToHydrate = fileFields.filter(f => {
      // If we are at root, check userColumns. Otherwise, assume allowed if in fileFields
      if (userColumns.positive.length > 0 && !isArray) {
        return userColumns.positive.includes(f);
      }
      return true;
    });

    if (fieldsToHydrate.length) {
      await hydrateFileFields(record, fieldsToHydrate);
    }

    // 3. Hydrate User Fields
    if (userFields.length) {
      await hydrateUserFields(record, userFields);
    }

    // 4. Recursive hydration for includes
    if (include && include.length) {
      for (const inc of include) {
        const alias = inc.as;
        if (record[alias]) {
          await performHydration(record[alias], inc);
        }
      }
    }
  }

  return data;
};

/**
 * Generic fetch helper for any model with columns, protected fields, pagination, cache, etc.
 *
 * @param {Sequelize.Model} model - Sequelize model to query
 * @param {Object} req - Express req object
 * @param {String} cacheKey - Key prefix for caching
 * @param {Object} options - { defaultAttributes, protectedFields, defaultIncludes, mode }
 */
const detailQuery = async (model, req, key, options = {}) => {
  const { defaultAttributes = [], protectedFields = [], defaultIncludes = [], where: extraWhere, includeWhere, editDesc, fileFields = [], userFields = [], raw = false } = options;

  // ------------------ Cache ------------------
  let cachedData = null;
  let sourceName = 'db';
  if (key) {
    const { data, name } = await cache.getCache(req, key);
    cachedData = data;
    sourceName = name;
    if (cachedData) {
      if (cachedData.data && editDesc && typeof cachedData.data[editDesc] === 'object') {
        cachedData.data[editDesc] = JSON.stringify(cachedData.data[editDesc]);
      }
      return { data: cachedData, name: sourceName };
    }
  }

  // ------------------ Columns ------------------
  const userColumns = parseColumns(req.query, protectedFields, defaultAttributes);

  // ------------------ Include ------------------
  const include = getIncludeList(req.query?.columns, userColumns, defaultIncludes);

  const queryConfig = buildQuery(req.query, { include, userColumns });

  // Merge extra root where if provided programmatically
  applyWhere(queryConfig, extraWhere, includeWhere);

  // ------------------ Execute ------------------

  let row, plain;
  if (raw) {
    const qi = model.sequelize.getQueryInterface();
    const qg = qi.queryGenerator;
    const qc = { ...queryConfig };
    delete qc.attributes;
    qc.limit = 1;
    const sql = qg.selectQuery(model.getTableName(), qc, model);
    const rows = await model.sequelize.query(sql, { type: model.sequelize.QueryTypes.SELECT });
    row = rows && rows[0] ? rows[0] : null;
    plain = row || null;
  } else {
    row = await model.findOne(queryConfig);
    plain = row ? row.get({ plain: true }) : null;
  }

  // ------------------ Recursive Hydration ------------------
  if (plain) {
    plain = await performHydration(plain, { editDesc, fileFields, userFields, include }, userColumns);

    // Also normalize drafts[].data: parse JSON string and hydrate description inside
    if (Array.isArray(plain.drafts)) {
      try {
        plain.drafts = await Promise.all(plain.drafts.map(async (d) => {
          let draftData = d && d.data;
          if (typeof draftData === 'string') {
            try { draftData = JSON.parse(draftData); } catch (_) { draftData = null; }
          }
          if (draftData && editDesc && Object.prototype.hasOwnProperty.call(draftData, editDesc)) {
            try {
              const draftDesc = JSON.parse(JSON.stringify(draftData[editDesc]));
              const hydratedDraft = await hydrateEditorDescriptionForEdit(draftDesc);
              draftData[editDesc] = JSON.stringify(hydratedDraft);
            } catch (_) { }
          }
          return { ...d, data: draftData };
        }));
      } catch (_) { }
    }
  }

  const response = { status: true, data: plain };
  if (key) {
    const ttlSeconds = req.query && req.query.ttl ? parseInt(req.query.ttl) : undefined;
    cache.setCache(req, key, response, ttlSeconds);
  }
  return { data: response, name: sourceName }
};

module.exports = { detailQuery };