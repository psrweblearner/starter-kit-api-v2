'use strict';

const { Op } = require("sequelize");
const { parseSort } = require("./sort");
const { buildFilters } = require("./filters");
const { buildSearch } = require("./search");
/* ------------------------------------------------------
   🧠 Utility: Derive attributes based on user columns
------------------------------------------------------ */
const getAttributes = (userColumns = {}) => {
  const { positive = [], protected: protectedCols = [] } = userColumns;
  let attributes;

  // 1️⃣ If wildcard (*) — fetch all except protected
  if (positive.includes('*')) {
    attributes = { exclude: [...new Set(protectedCols)] };
  }
  // 2️⃣ If explicit positive columns — use them (excluding nested)
  else if (positive.length) {
    attributes = positive.filter(c => !c.includes('.'));
  }
  // 3️⃣ If no positive, but protected present — exclude protected
  else if (protectedCols.length) {
    attributes = { exclude: [...new Set(protectedCols)] };
  }
  // 4️⃣ Nothing specified (shouldn't happen if parseColumns handles it)
  else {
    attributes = undefined;
  }

  // 5️⃣ Clean up array excludes
  if (Array.isArray(attributes)) {
    attributes = attributes.filter(a => !protectedCols.includes(a));
  } else if (attributes?.exclude) {
    attributes.exclude = [...new Set(attributes.exclude)];
  }

  return attributes;
};

/* ------------------------------------------------------
   🧠 Core: Build Query Options
------------------------------------------------------ */
const buildQuery = (query,options = {}) => {
  let { page = 1, limit = 10, sort,columns, search, searchColumns, ...filters } = query;
  page = parseInt(page);
  limit = limit === "all" ? null : parseInt(limit);
  const offset = limit ? (page - 1) * limit : undefined;
  const order = parseSort(sort);
  const include = options.include || [];
  const userColumns = options.userColumns || {};
  const attributes = getAttributes(userColumns);
  const where = buildFilters(filters, include);
  const searchWhere = buildSearch(search, searchColumns);
  if (searchWhere) where[Op.and] = where[Op.and] ? [...where[Op.and], searchWhere] : [searchWhere];
  return { offset, limit, order, attributes, where, include };
};
module.exports = { buildQuery };