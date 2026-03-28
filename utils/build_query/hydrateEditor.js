'use strict';

const models = require("../../models");

const joinBaseUrlAndPath = (baseUrl = "", filePath = "") => {
  const base = String(baseUrl || "").trim().replace(/\/+$/, "");
  const path = String(filePath || "").trim();

  if (!base) {
    return path ? (path.startsWith("/") ? path : `/${path}`) : "";
  }

  if (!path) {
    return base;
  }

  return `${base}/${path.replace(/^\/+/, "")}`;
};

/* ------------------------------------------------------
   🧠 Hydrate Editor.js minimal structure
------------------------------------------------------ */
const hydrateEditorDescriptionForEdit = async (descriptionJson) => {
  try {
    if (!descriptionJson) return descriptionJson;

    const src = typeof descriptionJson === "string" ? JSON.parse(descriptionJson) : descriptionJson;
    const blocks = Array.isArray(src?.blocks) ? src.blocks : [];
    if (!blocks.length) return { blocks: [] };

    // Collect all image file IDs
    const fileIds = [
      ...new Set(
        blocks
          .filter(b => b?.type === "image" && (b.data?.fileId || b.data?.id))
          .map(b => b.data.fileId || b.data.id)
          .filter(Boolean)
      )
    ];

    // Fetch file records from DB
    const files = await models.File.findAll({ where: { id: fileIds } });

    // Build file map with domain
    const fileMap = {};
    for (const f of files) {
      const setting = await models.Setting.findOne({
        where: { title: "cdn", type: f.storage_provider }
      });
      const domain = setting?.value?.replace(/\/$/, "") || "";
      fileMap[f.id] = {
        id: f.id,
        file: joinBaseUrlAndPath(domain, f.file_path),
        type: f.mime_type
      };
    }

    // Map blocks
    const hydratedBlocks = blocks.map((b) => {
      const { type, data = {} } = b;

      if (type === "image") {
        const fid = data.fileId || data.id;
        const meta = fileMap[fid];
        return {
          type: "image",
          data: {
            id: fid,
            file: meta?.file || "",
            type: meta?.type || data.mimeType || null,
            caption: data.caption || "",
            ...(data.link ? { link: data.link } : {})
          }
        };
      }

      if (type === "header") {
        return { type, data: { text: data.text || "", level: data.level || 1 } };
      }

      if (type === "paragraph") {
        return { type, data: { text: data.text || "" } };
      }

      return { type, data };
    });

    return { blocks: hydratedBlocks };
  } catch (err) {
    console.error("hydrateEditorDescriptionForEdit error:", err);
    return descriptionJson;
  }
};
module.exports = { hydrateEditorDescriptionForEdit };
