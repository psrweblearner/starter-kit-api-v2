// services/v1/fileManager/deleteFile.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { File } = require('../../../models');
const { normalizeStoragePath } = require('../../../helper/utils');

module.exports = async (req) => {
    const fileId = req.params.fileId;
    const file = await File.findByPk(fileId);

    if (!file) {
        throw new Error('File not found');
    }

    const storagePath = normalizeStoragePath(file.file_path);
    await storageService.deleteFile(storagePath);

    // Delete from database
    await file.destroy();

    return {
        data: { success: true },
        name: 'deleteFile'
    };
};
