// services/v1/fileManager/removeFolder.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { Op } = require('sequelize');
const { File, Folder } = require('../../../models');

module.exports = async (req) => {
    const { id } = req.params;

    if (!id) {
        throw new Error('Folder ID is required');
    }

    const currentStorageProvider = storageService.getProviderName();

    // Find folder by ID & provider
    const folderRecord = await Folder.findOne({
        where: { id, storage_provider: currentStorageProvider }
    });

    if (!folderRecord) {
        throw new Error('Folder not found');
    }

    const fullPath = folderRecord.full_path;

    // Delete all files under this folder & subfolders
    await File.destroy({
        where: {
            folder_path: { [Op.like]: `${fullPath}%` },
            storage_provider: currentStorageProvider
        }
    });

    // Delete all nested subfolders
    await Folder.destroy({
        where: {
            full_path: { [Op.like]: `${fullPath}/%` },
            storage_provider: currentStorageProvider
        }
    });

    // Delete the folder itself
    await folderRecord.destroy();

    // Delete from actual storage (local / cloud)
    const storageResult = await storageService.deleteFolder(fullPath);

    if (!storageResult) {
        throw new Error('Failed to delete folder from storage provider');
    }

    return {
        data: { success: true },
        name: 'removeFolder'
    };
};
