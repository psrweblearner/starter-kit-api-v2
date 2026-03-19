'use strict';

const models = require("../../models");
/* ------------------------------------------------------
   🧠 Hydrate fileId fields with file objects
------------------------------------------------------ */
const hydrateFileFields = async (records, fileFields = []) => {
  if (!records || !fileFields.length) return records;

  const rows = Array.isArray(records) ? records : [records];

  // 1️⃣ Collect all file IDs
  const fileIds = new Set(
    rows.flatMap((r) => fileFields.map((f) => r[f]).filter(Boolean))
  );

  if (!fileIds.size) return Array.isArray(records) ? rows : rows[0];

  // 2️⃣ Fetch files
  const files = await models.File.findAll({ where: { id: Array.from(fileIds) } });

  // 3️⃣ Create file map with safe domain merge
  const fileMap = {};

  for (const f of files) {
    const setting = await models.Setting.findOne({
      where: { title: "cdn", type: f.storage_provider }
    });
    let domain = setting?.value || "";

    // Ensure single slash between domain and file_path
    if (domain.endsWith("/")) domain = domain.slice(0, -1);
    const filePath = f.file_path.startsWith("/") ? f.file_path : "/" + f.file_path;

    fileMap[f.id] = {
      id: f.id,
      file: domain + filePath,
      type: f.mime_type
    };
  }

  // 4️⃣ Hydrate records
  rows.forEach((r) =>
    fileFields.forEach((f) => {
      const fileId = r[f];
      r[f] = fileId && fileMap[fileId] ? fileMap[fileId] : null;
    })
  );

  return Array.isArray(records) ? rows : rows[0];
};
module.exports = { hydrateFileFields };