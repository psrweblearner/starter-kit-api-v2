// services/v1/fileManager/findAllFiles.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');
const { Op } = require('sequelize');
const { File, Folder } = require('../../../models');
const { hydrateFileFields } = require('../../../utils/build_query/hydrateFiles');

const cacheManager = require('../../../utils/cacheManager');

module.exports = async (req) => {
    const {
        folder_id = null,
        page = 1,
        limit = 20,
        search = '',
        mime_type = ''
    } = req.query;

    const currentStorageProvider = storageService.getProviderName();

    // Cache lookup
    const cacheKey = `file-folder-list:files:${currentStorageProvider}:${folder_id}:${JSON.stringify(req.query)}`;
    const { data: cachedData, name: sourceName } = await cacheManager.getCache(req, cacheKey);
    if (cachedData) {
        return { data: cachedData, name: sourceName };
    }

    // File conditions
    const fileWhereConditions = {
        is_active: true,
        storage_provider: currentStorageProvider
    };

    if (folder_id) {
        fileWhereConditions.folder_id = folder_id;
    } else {
        fileWhereConditions.folder_id = null;
    }

    if (search) {
        fileWhereConditions[Op.or] = [
            { original_name: { [Op.like]: `%${search}%` } },
            { file_name: { [Op.like]: `%${search}%` } }
        ];
    }

    if (mime_type) {
        fileWhereConditions.mime_type = { [Op.like]: `${mime_type}%` };
    }

    // Pagination setup
    const itemsPerPage = parseInt(limit);
    const currentPage = parseInt(page);
    const offset = (currentPage - 1) * itemsPerPage;

    // Folder conditions
    const folderWhere = {
        is_active: true,
        storage_provider: currentStorageProvider,
        parent_id: folder_id || null
    };

    // Count totals
    const totalFileCount = await File.count({ where: fileWhereConditions });
    const totalFolderCount = await Folder.count({ where: folderWhere });
    const totalItems = totalFileCount + totalFolderCount;

    // Fetch folders (sorted by name ASC)
    const allFolders = await Folder.findAll({
        where: folderWhere,
        order: [['name', 'ASC']]
    });

    // Fetch files (sorted by createdAt DESC)
    let allFiles = await File.findAll({
        attributes: ['id', 'file_name', 'file_size', 'mime_type', 'folder_id', 'createdAt'],
        where: fileWhereConditions,
        include: [
            { model: Folder, as: 'folder', attributes: ['id', 'name', 'full_path'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Convert Sequelize instances → plain objects
    allFiles = allFiles.map(f => f.get({ plain: true }));

    // Hydrate file URLs
    allFiles = await hydrateFileFields(allFiles, ["id"]);

    // Add computed fields
    allFiles = allFiles.map(file => ({
        ...file,
        isFolder: false,
        type: 'file',
        complete_path: file.folder
            ? `${file.folder.full_path}/${file.file_name}`
            : file.file_name
    }));

    const allFolderItems = allFolders.map(folder => ({
        ...folder.toJSON(),
        isFolder: true,
        type: 'folder',
        complete_path: folder.full_path
    }));

    // Combine: Folders first (sorted ASC), then Files (sorted DESC)
    const allItems = [...allFolderItems, ...allFiles];

    // Apply pagination after combining
    const paginatedItems = allItems.slice(offset, offset + itemsPerPage);

    // Pagination details
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = Math.min(offset + 1, totalItems);
    const endItem = Math.min(offset + paginatedItems.length, totalItems);
    const hasMoreData = currentPage < totalPages;

    const visiblePages = Array.from(
        { length: hasMoreData ? currentPage + 1 : currentPage },
        (_, i) => i + 1
    );

    // Final response
    const response = {
        items: paginatedItems,
        totalItems,
        pagination: {
            currentPage,
            totalPages,
            visiblePages,
            itemsPerPage,
            hasNextPage: hasMoreData,
            hasPrevPage: currentPage > 1,
            showingFrom: totalItems > 0 ? startItem : 0,
            showingTo: endItem,
            displayText: `Showing ${startItem} to ${endItem} of ${totalItems} entries`
        }
    };

    // Store in cache
    await cacheManager.setCache(req, cacheKey, response);

    return { data: response, name: 'db' };
};
