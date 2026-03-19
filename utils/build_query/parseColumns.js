'use strict';
/* ------------------------------------------------------
   🧠 Utility: Parse and categorize column selections
------------------------------------------------------ */
const parseColumns = (query = {}, protectedFields = [], defaultAttributes = []) => {
  const raw = query.columns || '';
  const result = { positive: [], protected: [...protectedFields] }; // start with global protected
  if (!raw) {
    // No columns specified → use defaults as positive
    result.positive = [...defaultAttributes];
    return result;
  }

  // Split by comma, but keep ![ ... ] together
  const cols = raw.match(/!\[.*?\]|[^,]+/g)?.map(c => c.trim()) || [];

  cols.forEach(col => {
    if (!col) return;

    // 1️⃣ Multi-field protected: ![a,b,c]
    if (col.startsWith('![') && col.endsWith(']')) {
      const inside = col.slice(2, -1)
                        .split(',')
                        .map(c => c.trim())
                        .filter(Boolean);
      result.protected.push(...inside);
    }
    // 2️⃣ Single-field protected: !field
    else if (col.startsWith('!')) {
      result.protected.push(col.slice(1));
    }
    // 3️⃣ Positive or wildcard (*)
    else {
      result.positive.push(col);
    }
  });

  // Remove duplicates
  result.positive = [...new Set(result.positive)];
  result.protected = [...new Set(result.protected)];

  return result;
};
module.exports = { parseColumns };