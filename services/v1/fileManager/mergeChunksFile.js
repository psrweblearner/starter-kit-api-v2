// services/v1/fileManager/mergeChunksFile.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { File } = require('../../../models');
const { uniqueId } = require('../../../helper/utils');
const fs = require('fs');
const path = require('path');
const uploadChunkFile = require('./uploadChunkFile');

const sessions = uploadChunkFile.sessions;

const cacheManager = require('../../../utils/cacheManager');

module.exports = async (req) => {
    const { folderName = '', folder_id, fileName, fileId, is_public } = req.body || {};
    const isPublic = is_public === true || is_public === 'true' || is_public === 1 || is_public === '1';

    if (!fileName || !fileId) {
        throw new Error('Missing file merge params');
    }

    const sessionKey = `simple_${fileId}`;

    if (!sessions.has(sessionKey)) {
        throw new Error('Upload session not found');
    }

    const session = sessions.get(sessionKey);
    const { sessionDir, totalChunks } = session;

    const parts = [];
    for (let i = 0; i < totalChunks; i++) {
        const p = path.join(sessionDir, `${i}.part`);
        if (!fs.existsSync(p)) {
            throw new Error(`Missing chunk ${i}`);
        }
        parts.push(fs.readFileSync(p));
    }

    const buffer = Buffer.concat(parts);
    const timestamp = Date.now();
    const finalName = `${timestamp}_${fileName}`;
    const meta = { mimeType: 'application/octet-stream' };

    // Handle root directory upload (when folderName is undefined or empty)
    const uploadFolder = folderName || '';
    const result = await storageService.uploadFile(buffer, finalName, uploadFolder, meta);

    if (!result.success) {
        // Cleanup on failure
        try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (_) { }
        sessions.delete(sessionKey);
        throw new Error('Failed to save assembled file');
    }

    // Save to database
    const fileRecord = await File.create({
        id: uniqueId(6),
        original_name: fileName,
        file_name: finalName,
        file_path: result.filePath,
        file_size: buffer.length,
        mime_type: 'application/octet-stream',
        storage_provider: storageService.getProviderName(),
        folder_id: folder_id || null,
        folder_path: uploadFolder,
        reference_count: 0,
        is_public: isPublic,
        createdBy: req.user?.id || null
    });

    // Cleanup temp files
    try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (_) { }
    sessions.delete(sessionKey);

    return {
        data: {
            id: fileRecord.id,
            fileName: finalName,
            originalName: fileName,
            fileUrl: result.fileUrl,
            fileSize: result.fileSize
        },
        name: 'mergeChunksFile'
    };
};
