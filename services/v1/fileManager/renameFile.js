// services/v1/fileManager/renameFile.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { File } = require('../../../models');
const { normalizeStoragePath } = require('../../../helper/utils');

module.exports = async (req) => {
    const { oldPath, newPath, fileId } = req.body || {};
    let fileToRename;

    // Identify file
    if (fileId) {
        fileToRename = await File.findByPk(fileId);
        if (!fileToRename) {
            throw new Error('File not found');
        }
    } else if (oldPath) {
        fileToRename = await File.findOne({
            where: { file_path: oldPath, is_active: true }
        });
        if (!fileToRename) {
            throw new Error('File not found');
        }
    } else {
        throw new Error('fileId or oldPath is required');
    }

    const newFileName = newPath.includes('/') ? newPath.split('/').pop() : newPath;
    const folderPath = fileToRename.folder_path || '';
    const newRelativePath = folderPath ? `${folderPath}/${newFileName}` : newFileName;

    // Normalize for storage
    const storageType = storageService.getProviderName();
    const oldStoragePath = normalizeStoragePath(fileToRename.file_path);
    let newStoragePath = newRelativePath.replace(/^\/?uploads\//, '');
    let dbFilePath = storageType === 'local' ? `/uploads/${newRelativePath}` : newRelativePath;

    // Rename in storage
    const renameResult = await storageService.renameFile(oldStoragePath, newStoragePath);

    if (!renameResult) {
        throw new Error('Failed to rename file in storage');
    }

    // Update DB record
    await fileToRename.update({
        original_name: newFileName,
        file_name: newFileName,
        file_path: dbFilePath,
        updated_at: new Date(),
    });


    return {
        data: {
            id: fileToRename.id,
            newPath: dbFilePath
        },
        name: 'renameFile'
    };
};
