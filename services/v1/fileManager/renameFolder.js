// services/v1/fileManager/renameFolder.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { Op } = require('sequelize');
const { File, Folder } = require('../../../models');
const fs = require('fs');
const path = require('path');

module.exports = async (req) => {
    const { folderId, oldPath, newPath } = req.body || {};
    let folderToRename;

    // Find the folder
    if (folderId) {
        folderToRename = await Folder.findByPk(folderId);
    } else if (oldPath) {
        folderToRename = await Folder.findOne({
            where: { full_path: oldPath, is_active: true }
        });
    }

    if (!folderToRename) {
        throw new Error('Folder not found');
    }

    // Compute new full path
    const newFolderName = newPath.includes('/') ? newPath.split('/').pop() : newPath;
    let newFullPath = folderToRename.parent_id
        ? `${(await Folder.findByPk(folderToRename.parent_id)).full_path}/${newFolderName}`
        : newFolderName;

    // Check if a folder with the new name exists
    const existingFolder = await Folder.findOne({
        where: { full_path: newFullPath, is_active: true }
    });

    if (existingFolder && existingFolder.id !== folderToRename.id) {
        throw new Error('Folder with this name already exists');
    }

    // Handle storage rename
    const storageType = storageService.getProviderName();

    if (storageType === 'local') {
        // Windows-safe recursive move
        const moveFolderRecursively = (oldFolder, newFolder) => {
            oldFolder = path.resolve(oldFolder);
            newFolder = path.resolve(newFolder);

            if (!fs.existsSync(oldFolder)) {
                throw new Error('Source folder does not exist');
            }

            if (!fs.existsSync(newFolder)) {
                fs.mkdirSync(newFolder, { recursive: true });
            }

            const items = fs.readdirSync(oldFolder);
            for (const item of items) {
                const oldItemPath = path.join(oldFolder, item);
                const newItemPath = path.join(newFolder, item);
                fs.renameSync(oldItemPath, newItemPath);
            }

            fs.rmdirSync(oldFolder);
        };

        const oldStoragePath = folderToRename.full_path.replace(/^\/?uploads\//, '');
        const newStoragePath = newFullPath.replace(/^\/?uploads\//, '');
        moveFolderRecursively(
            path.join('public', 'uploads', oldStoragePath),
            path.join('public', 'uploads', newStoragePath)
        );

    } else {
        // AWS/GCP
        const oldStoragePath = folderToRename.full_path;
        const newStoragePath = newFullPath;
        await storageService.renameFolder(oldStoragePath, newStoragePath);
    }

    // Update DB for current folder
    const oldFullPath = folderToRename.full_path;
    await folderToRename.update({
        name: newFolderName,
        full_path: newFullPath,
        updated_at: new Date()
    });

    // Update DB for subfolders
    const subfolders = await Folder.findAll({
        where: {
            full_path: { [Op.like]: `${oldFullPath}/%` },
            is_active: true
        },
    });

    for (const subfolder of subfolders) {
        const updatedPath = subfolder.full_path.replace(oldFullPath, newFullPath);
        await subfolder.update({
            full_path: updatedPath,
            updated_at: new Date()
        });
    }

    // Update DB for files
    const files = await File.findAll({
        where: {
            folder_path: { [Op.like]: `${oldFullPath}%` },
            is_active: true
        },
    });

    for (const file of files) {
        const updatedFolderPath = file.folder_path.replace(oldFullPath, newFullPath);
        const updatedFilePath = file.file_path.replace(oldFullPath, newFullPath);

        const dbFilePath = storageType === 'local'
            ? (updatedFilePath.startsWith('/uploads/') ? updatedFilePath : `/uploads/${updatedFilePath}`)
            : updatedFilePath;

        await file.update({
            folder_path: updatedFolderPath,
            file_path: dbFilePath,
            updated_at: new Date()
        });
    }

    return {
        data: { success: true },
        name: 'renameFolder'
    };
};
