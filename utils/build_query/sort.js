'use strict';
/* ------------------------------------------------------
   🧠 Utility: Parse sorting parameters
------------------------------------------------------ */
const parseSort = (sort = "") =>
  sort
    ? sort.split(",").map((s) => {
        const [col, dir] = s.split(":");
        return [col, dir?.toUpperCase() || "ASC"];
      })
    : [];
module.exports = { parseSort };