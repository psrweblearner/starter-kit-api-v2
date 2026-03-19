// services/v1/fileManager/helpers/fetchAndSync.js
'use strict';
const storageService = require('../../../../utils/file-manager/storageService');
const syncFolder = require('./syncFolder');
const syncFile = require('./syncFile');

module.exports = async (req, folderPath, storageProvider, lastSyncDate, syncStats) => {
    try {
        let page = 1;
        const limit = 1000;

        while (true) {
            const { success, items } = await storageService.listFiles(folderPath, { page, limit });

            if (!success || !items.length) break;

            const newItems = items.filter(item =>
                new Date(item.created || item.modified) >= lastSyncDate
            );

            for (const item of newItems) {
                syncStats.totalProcessed++;
                if (item.isFolder) {
                    await syncFolder(req, item, storageProvider, syncStats);
                } else {
                    await syncFile(req, item, storageProvider, syncStats);
                }
            }

            if (items.length < limit) break;
            page++;
        }

    } catch (error) {
        console.error(`Error fetching/syncing folder ${folderPath}:`, error);
        syncStats.errors++;
    }
};
