'use strict';

/* ------------------------------------------------------
   🧠 Validate publish required fields
------------------------------------------------------ */
const validatePublish = (record, requiredFields = []) => {
  const missing = requiredFields.filter(
    (f) => !record[f] || (typeof record[f] === "string" && !record[f].trim())
  );
  return missing;
};
module.exports = { validatePublish };