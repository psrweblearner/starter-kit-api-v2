// services/v1/fileManager/syncStorage.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { File, Folder } = require('../../../models');
const fetchAndSync = require('./helpers/fetchAndSync');

const cacheManager = require('../../../utils/cacheManager');

module.exports = async (req) => {
    const { folderPath = '' } = req.query;
    const storageProvider = storageService.getProviderName();

    // Get last synced date from DB
    const lastFile = await File.findOne({
        where: { storage_provider: storageProvider, is_active: true },
        order: [['createdAt', 'DESC']]
    });

    const lastFolder = await Folder.findOne({
        where: { storage_provider: storageProvider, is_active: true },
        order: [['createdAt', 'DESC']]
    });

    const lastSyncDate = new Date(Math.min(
        lastFile?.createdAt?.getTime() || 0,
        lastFolder?.createdAt?.getTime() || 0
    ));

    const syncStats = {
        foldersAdded: 0,
        filesAdded: 0,
        foldersUpdated: 0,
        filesUpdated: 0,
        totalProcessed: 0,
        errors: 0
    };

    await fetchAndSync(req, folderPath, storageProvider, lastSyncDate, syncStats);

    // Invalidate Cache using the prefix specified for file/folder lists
    await cacheManager.delCache(req, 'file-folder-list:*', true);

    return {
        data: {
            stats: syncStats,
            provider: storageProvider,
            syncedFolder: folderPath || 'root'
        },
        name: 'syncStorage'
    };
};
