// services/v1/fileManager/helpers/syncFolder.js
'use strict';
const { Folder } = require('../../../../models');
const { uniqueId } = require('../../../../helper/utils');
const getParentFolderId = require('./getParentFolderId');

module.exports = async (req, folderItem, storageProvider, syncStats) => {
    try {
        const existingFolder = await Folder.findOne({
            where: {
                full_path: folderItem.fullPath,
                storage_provider: storageProvider
            }
        });

        if (existingFolder) {
            if (!existingFolder.is_active) {
                await existingFolder.update({
                    is_active: true,
                    createdAt: folderItem.created,
                    updated_at: folderItem.modified
                });
                syncStats.foldersAdded++;
            } else {
                await existingFolder.update({
                    createdAt: folderItem.created,
                    updated_at: folderItem.modified
                });
                syncStats.foldersUpdated++;
            }
        } else {
            const parentId = await getParentFolderId(folderItem.fullPath, storageProvider);
            await Folder.create({
                id: uniqueId(6),
                name: folderItem.name,
                parent_id: parentId,
                full_path: folderItem.fullPath,
                storage_provider: storageProvider,
                createdAt: folderItem.created,
                updated_at: folderItem.modified,
                createdBy: req.user?.id || 'system',
                is_active: true
            });
            syncStats.foldersAdded++;
        }

    } catch (error) {
        console.error(`Error syncing folder ${folderItem.fullPath}:`, error);
        syncStats.errors++;
    }
};
