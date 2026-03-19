'use strict';

/* ------------------------------------------------------
   🧠 Dynamic Include Generator
------------------------------------------------------ */
const getIncludeList = (cols,columns = { positive: [], protected: [] }, defaultIncludes = []) => {
  if (!cols || !defaultIncludes.length) return defaultIncludes;

  const { positive = [], protected: protectedCols = [] } = columns;

  return defaultIncludes
    .map((inc) => {
      // Find all positive columns that belong to this include (starts with include alias + '.')
      const matchedPositive = positive
        .filter((c) => c.startsWith(`${inc.as}.`))
        .map((c) => c.slice(inc.as.length + 1)); // remove prefix 'roles.'

      if (!matchedPositive.length) return null;

      // Determine attributes for this include
      let attrs = matchedPositive.length ? [...new Set(matchedPositive.map((c) => c.split('.')[0]))] : undefined;

      // Apply include-level protected fields
      const includeProtected = Array.isArray(inc.protected) ? inc.protected : [];
      const matchedProtected = protectedCols
        .filter((c) => c.startsWith(`${inc.as}.`))
        .map((c) => c.slice(inc.as.length + 1));

      if (includeProtected.length || matchedProtected.length) {
        const allProtected = [...includeProtected, ...matchedProtected];
        if (attrs === undefined) attrs = { exclude: allProtected };
        else attrs = attrs.filter((a) => !allProtected.includes(a));
      }

      // Handle nested includes recursively
      let nestedIncludes = (inc.include || []).map((n) => ({ ...n }));
      if (nestedIncludes.length) {
        const nestedPositive = matchedPositive.filter((c) => c.includes('.'));
        const nestedProtected = matchedProtected.filter((c) => c.includes('.'));
        nestedIncludes = getIncludeList(
          { positive: nestedPositive, protected: nestedProtected },
          nestedIncludes
        );
      }

      return { ...inc, attributes: attrs, include: nestedIncludes };
    })
    .filter(Boolean);
};
module.exports = { getIncludeList };