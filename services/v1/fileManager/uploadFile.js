// services/v1/fileManager/uploadFile.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { File } = require('../../../models');
const { uniqueId } = require('../../../helper/utils');

module.exports = async (req) => {
    if (!req.file) {
        throw new Error('No file uploaded');
    }

    const { folder_id, folder_path = '', folder, is_public } = req.body;
    const { buffer, originalname, mimetype } = req.file;
    const timestamp = Date.now();
    const fileName = `${timestamp}_${originalname}`;
    const meta = { mimeType: mimetype };
    const uploadFolder = folder_path || folder || '';

    const result = await storageService.uploadFile(buffer, fileName, uploadFolder, meta);

    if (!result.success) {
        throw new Error('Failed to upload file');
    }

    const isPublic = is_public === true || is_public === 'true' || is_public === 1 || is_public === '1';

    await File.create({
        id: uniqueId(6),
        original_name: originalname,
        file_name: fileName,
        file_path: result.filePath,
        file_size: buffer.length,
        mime_type: mimetype,
        storage_provider: storageService.getProviderName(),
        folder_id: folder_id || null,
        folder_path: uploadFolder,
        reference_count: 0,
        is_public: isPublic,
        createdBy: req.user?.id || null
    });


    return { data: { success: true }, name: 'uploadFile' };
};
