'use strict';
const { Op } = require('sequelize');
/* ------------------------------------------------------
   🧠 Utility: Parse comparison filters
------------------------------------------------------ */
const parseFilter = (val = "") => {
  if (val.startsWith("!=")) return { op: Op.ne, value: val.slice(2) };
  if (val.startsWith(">=")) return { op: Op.gte, value: val.slice(2) };
  if (val.startsWith("<=")) return { op: Op.lte, value: val.slice(2) };
  if (val.startsWith(">")) return { op: Op.gt, value: val.slice(1) };
  if (val.startsWith("<")) return { op: Op.lt, value: val.slice(1) };
  if (val.startsWith("=")) return { op: Op.eq, value: val.slice(1) };
  return { op: Op.eq, value: val };
};

/* ------------------------------------------------------
   🧠 Utility: Build WHERE filters
------------------------------------------------------ */
const buildFilters = (filters = {}, include = []) => {
  const where = {};

  for (const key in filters) {
    if (!filters[key]) continue;
    const rawVal = filters[key];

    if (key.includes(".")) {
      const parts = key.split(".");
      const field = parts.pop();
      let currentIncludes = include;
      let includeDef = null;

      for (const alias of parts) {
        includeDef = (currentIncludes || []).find((i) => i.as === alias);
        if (!includeDef) break;
        if (!includeDef.include) includeDef.include = [];
        currentIncludes = includeDef.include;
      }

      if (includeDef) {
        const { op, value } = parseFilter(rawVal);
        includeDef.where = { ...includeDef.where, [field]: { [op]: value } };
      }
    } else {
      if (rawVal.includes(",") && !/[<>=!]/.test(rawVal)) {
        const [start, end] = rawVal.split(",");
        where[key] = { [Op.between]: [new Date(start), new Date(end)] };
      } else {
        const { op, value } = parseFilter(rawVal);
        where[key] = { [op]: value };
      }
    }
  }

  return where;
};
module.exports = { buildFilters, parseFilter };