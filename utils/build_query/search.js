'use strict';
const { Op, Sequelize } = require("sequelize");

/* ------------------------------------------------------
   🧠 Utility: Global search
------------------------------------------------------ */
const buildSearch = (search, searchColumns) => {
  if (!search || !searchColumns) return null;

  const cols = searchColumns.split(",");
  const tokens = search.replace(/^'+|'+$/g, "").trim().split(/\s+/);

  const rootSearch = tokens.map((token) => ({
    [Op.or]: cols.map((col) =>
      col.includes(".")
        ? Sequelize.where(Sequelize.col(col), { [Op.like]: `%${token}%` })
        : { [col]: { [Op.like]: `%${token}%` } }
    ),
  }));

  return rootSearch.length ? { [Op.and]: rootSearch } : null;
};
module.exports = { buildSearch };