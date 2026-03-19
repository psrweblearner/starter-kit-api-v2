// services/v1/fileManager/findAllFolder.js
'use strict';
const { Folder } = require('../../../models');

const cacheManager = require('../../../utils/cacheManager');

module.exports = async (req) => {
    const { folder_id = null } = req.query;

    // Get current storage provider
    const storageService = require('../../../utils/file-manager/storageService');
    const currentStorageProvider = storageService.getProviderName();

    // Cache lookup using the prefix specified in controller
    const cacheKey = `file-folder-list:folders:${currentStorageProvider}:${folder_id}:${JSON.stringify(req.query)}`;
    const { data: cachedData, name: sourceName } = await cacheManager.getCache(req, cacheKey);
    if (cachedData) {
        return { data: cachedData, name: sourceName };
    }

    // Build where conditions
    const folderWhere = {
        is_active: true,
        storage_provider: currentStorageProvider
    };

    if (folder_id !== null && folder_id !== '') {
        folderWhere.parent_id = folder_id;
    } else {
        folderWhere.parent_id = null; // Root folders
    }

    // Fetch folders
    const folders = await Folder.findAll({
        where: folderWhere,
        order: [['name', 'ASC']]
    });

    const response = {
        folders: folders.map(folder => ({
            ...folder.toJSON(),
            isFolder: true,
            type: 'folder'
        }))
    };

    // Store in cache
    await cacheManager.setCache(req, cacheKey, response);

    return {
        data: response,
        name: 'db'
    };
};
