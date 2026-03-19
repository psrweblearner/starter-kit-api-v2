// services/v1/fileManager/helpers/syncFile.js
'use strict';
const { File } = require('../../../../models');
const { uniqueId } = require('../../../../helper/utils');
const getParentFolderId = require('./getParentFolderId');
const path = require('path');

module.exports = async (req, fileItem, storageProvider, syncStats) => {
    try {
        const existingFile = await File.findOne({
            where: {
                file_path: fileItem.fullPath,
                storage_provider: storageProvider
            }
        });

        if (existingFile) {
            if (!existingFile.is_active) {
                await existingFile.update({
                    is_active: true,
                    createdAt: fileItem.created,
                    updated_at: fileItem.modified,
                    file_size: fileItem.size || existingFile.file_size
                });
                syncStats.filesAdded++;
            } else {
                await existingFile.update({
                    createdAt: fileItem.created,
                    updated_at: fileItem.modified,
                    file_size: fileItem.size || existingFile.file_size
                });
                syncStats.filesUpdated++;
            }
        } else {
            const folderId = await getParentFolderId(fileItem.fullPath, storageProvider);
            await File.create({
                id: uniqueId(6),
                original_name: fileItem.name,
                file_name: fileItem.name,
                file_path: fileItem.fullPath,
                file_size: fileItem.size || 0,
                mime_type: fileItem.mimeType || 'application/octet-stream',
                storage_provider: storageProvider,
                folder_id: folderId,
                folder_path: path.dirname(fileItem.fullPath) || '',
                reference_count: 0,
                is_public: false,
                createdAt: fileItem.created,
                updated_at: fileItem.modified,
                createdBy: req.user?.id || 'system',
                is_active: true
            });
            syncStats.filesAdded++;
        }

    } catch (error) {
        console.error(`Error syncing file ${fileItem.fullPath}:`, error);
        syncStats.errors++;
    }
};
