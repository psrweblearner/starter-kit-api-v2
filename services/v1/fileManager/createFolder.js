'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { uniqueId } = require('../../../helper/utils');
const { Folder } = require('../../../models');
module.exports = async (req) => {
    const { name, parent_id, folderName } = req.body;
    let folderNameToUse, parentIdToUse;
    if (folderName) {
        const pathParts = folderName.split('/').filter(Boolean);
        folderNameToUse = pathParts[pathParts.length - 1]; // Last part is the folder name
        if (pathParts.length > 1) {
            const parentPath = pathParts.slice(0, -1).join('/');
            const parentFolder = await Folder.findOne({
                where: { full_path: parentPath, is_active: true }
            });
            parentIdToUse = parentFolder ? parentFolder.id : null;
        } else {
            parentIdToUse = null; // Root folder
        }
    } else {
        folderNameToUse = name;
        parentIdToUse = parent_id;
    }
    if (!folderNameToUse) {
        throw new Error('Folder name is required');
    }
    // Build full path
    let fullPath = folderNameToUse;
    if (parentIdToUse) {
        const parentFolder = await Folder.findByPk(parentIdToUse);
        if (parentFolder) {
            fullPath = parentFolder.full_path + '/' + folderNameToUse;
        }
    }
    // Check if folder already exists
    const existingFolder = await Folder.findOne({
        where: { full_path: fullPath, is_active: true }
    });

    if (existingFolder) {
        throw new Error('Folder already exists');
    }
    // Create folder in storage
    const result = await storageService.createFolder(fullPath);
    if (!result) {
        throw new Error('Failed to create folder');
    }
    // Create folder record in database
    const folderRecord = await Folder.create({
        id: uniqueId(6), name: folderNameToUse, parent_id: parentIdToUse, full_path: fullPath,
        storage_provider: storageService.getProviderName(), createdBy: req.user?.id || null
    });
    return {
        data: { id: folderRecord.id, name: folderRecord.name, Path: folderRecord.full_path, parentId: folderRecord.parent_id }, name: 'createFolder'
    };

};
