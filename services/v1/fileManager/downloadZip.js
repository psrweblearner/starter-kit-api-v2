// services/v1/fileManager/downloadZip.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const archiver = require('archiver');
const { URL } = require('url');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { normalizeStoragePath } = require('../../../helper/utils');

module.exports = async (req, res) => {
    const { files = [] } = req.body || {};

    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("files array is required");
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="files.zip"');

    archive.on("error", (err) => {
        console.error("ZIP error:", err);
        if (!res.headersSent) res.status(500).end();
    });

    archive.pipe(res);

    const provider = storageService.getConfig()?.storageType || "local";
    const base = provider === "local" ? storageService.getConfig().basePath : null;

    // Helper: stream remote file
    const getRemoteStream = (fileUrl) =>
        new Promise((resolve, reject) => {
            if (!fileUrl) return reject(new Error("Invalid file URL"));
            try {
                const parsed = new URL(fileUrl);
                const mod = parsed.protocol === "https:" ? https : http;
                const req = mod.get(parsed, (resp) => {
                    if (resp.statusCode >= 200 && resp.statusCode < 300) {
                        resolve(resp);
                    } else {
                        reject(new Error(`HTTP ${resp.statusCode}`));
                    }
                });
                req.on("error", reject);
            } catch (e) {
                reject(e);
            }
        });

    // Helper: add local file or folder
    const addLocal = (relPath, basePath, zipFolder = "") => {
        const normalized = normalizeStoragePath(relPath);
        const absPath = path.join(basePath, normalized);
        if (!fs.existsSync(absPath)) return;

        const stats = fs.statSync(absPath);
        if (stats.isDirectory()) {
            const items = fs.readdirSync(absPath);
            if (items.length === 0) {
                archive.append("", { name: path.join(zipFolder, path.basename(relPath), "/") });
            }

            for (const item of items) {
                const subRel = path.join(relPath, item);
                addLocal(subRel, basePath, path.join(zipFolder, path.basename(relPath)));
            }
        } else if (stats.isFile()) {
            const zipName = zipFolder
                ? path.join(zipFolder, path.basename(relPath))
                : path.basename(relPath);
            archive.file(absPath, { name: zipName });
        }
    };

    // Helper: add GCP file or folder
    const addRemote = async (item, zipFolder = "") => {
        try {
            const normalized = normalizeStoragePath(item);
            // If it's a file path, try downloading directly
            const fileUrl = storageService.getFileUrl(normalized);
            const stream = await getRemoteStream(fileUrl);
            const zipName = zipFolder ? path.join(zipFolder, path.basename(normalized)) : path.basename(normalized);
            archive.append(stream, { name: zipName });
        } catch (err) {
            const listRes = await storageService.listFiles(item);
            const allFiles = listRes?.items?.filter(f => !f.isFolder) || [];

            if (allFiles.length === 0) {
                archive.append("", { name: path.join(zipFolder, path.basename(item), "/") });
                return;
            }

            for (const file of allFiles) {
                try {
                    const subUrl = file.fileUrl || storageService.getFileUrl(file.fullPath);
                    const relativeName = file.fullPath.replace(item, "").replace(/^\/+/, "");
                    const zipName = path.join(zipFolder, path.basename(item), relativeName);
                    const stream = await getRemoteStream(subUrl);
                    archive.append(stream, { name: zipName });
                } catch (innerErr) {
                    console.warn("Skipping GCS file:", file.fullPath, innerErr.message);
                }
            }
        }
    };

    // Process all selected items
    for (const item of files) {
        if (provider === "local") {
            addLocal(item, base);
        } else {
            await addRemote(item);
        }
    }

    await archive.finalize();

    // This service directly writes to response, so no return needed
    // It's a special case that doesn't follow the standard pattern
};
