// services/v1/fileManager/helpers/searchInDatabase.js
'use strict';
const storageService = require('../../../../utils/file-manager/storageService');
const { Op } = require('sequelize');
const { File, Folder } = require('../../../../models');
const { hydrateFileFields } = require('../../../../utils/build_query/hydrateFiles');


module.exports = async (query, options = {}) => {
    try {
        const { page = 1, limit = 20, fileType = 'all', folderScope = false, exactMatch = false, currentFolder = '' } = options;

        const currentStorageProvider = storageService.getProviderName();
        const offset = (page - 1) * limit;
        const searchPattern = exactMatch ? query : `%${query}%`;

        const results = [];
        let totalItems = 0;

        // Helper: sort folders first
        const sortItems = (a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            if (a.isFolder && b.isFolder) return (a.name || '').localeCompare(b.name || '');
            return new Date(b.createdAt) - new Date(a.createdAt);
        };

        // CASE: Only folders
        if (fileType === 'folders') {
            const folderWhere = {
                is_active: true,
                storage_provider: currentStorageProvider,
                name: { [Op.like]: searchPattern }
            };

            if (folderScope && currentFolder) {
                folderWhere.full_path = { [Op.like]: `${currentFolder}%` };
            }

            const { count, rows } = await Folder.findAndCountAll({ where: folderWhere, order: [['name', 'ASC']], limit, offset });

            const folders = rows.map(f => ({ ...f.toJSON(), isFolder: true, type: 'folder' }));

            results.push(...folders);
            totalItems = count;
        }

        // CASE: Only files
        else if (fileType === 'files') {
            const fileWhere = {
                is_active: true,
                storage_provider: currentStorageProvider,
                [Op.or]: [
                    { original_name: { [Op.like]: searchPattern } },
                    { file_name: { [Op.like]: searchPattern } }
                ]
            };

            if (folderScope && currentFolder) {
                fileWhere.folder_path = { [Op.like]: `${currentFolder}%` };
            }

            const { count, rows } = await File.findAndCountAll({ where: fileWhere, include: [{ model: Folder, as: 'folder', attributes: ['id', 'name', 'full_path'] }], order: [['createdAt', 'DESC']], limit, offset });

            let files = rows.map(f => f.get({ plain: true }));

            // Hydrate file URLs
            files = await hydrateFileFields(files, ["id"]);

            files = files.map(f => ({
                ...f,
                isFolder: false,
                type: 'file'
            }));

            results.push(...files);
            totalItems = count;
        }

        // CASE: Both files + folders
        else {
            const folderLimit = Math.ceil(limit / 2);
            const fileLimit = Math.floor(limit / 2);
            const folderOffset = Math.floor(offset / 2);
            const fileOffset = Math.floor(offset / 2);

            const folderWhere = {
                is_active: true,
                storage_provider: currentStorageProvider,
                name: { [Op.like]: searchPattern }
            };

            if (folderScope && currentFolder) {
                folderWhere.full_path = { [Op.like]: `${currentFolder}%` };
            }

            const fileWhere = {
                is_active: true,
                storage_provider: currentStorageProvider,
                [Op.or]: [
                    { original_name: { [Op.like]: searchPattern } },
                    { file_name: { [Op.like]: searchPattern } }
                ]
            };

            if (folderScope && currentFolder) {
                fileWhere.folder_path = { [Op.like]: `${currentFolder}%` };
            }

            const [folderResult, fileResult] = await Promise.all([
                Folder.findAndCountAll({
                    where: folderWhere,
                    order: [['name', 'ASC']],
                    limit: folderLimit,
                    offset: folderOffset
                }),
                File.findAndCountAll({
                    where: fileWhere,
                    include: [{
                        model: Folder,
                        as: 'folder',
                        attributes: ['id', 'name', 'full_path']
                    }],
                    order: [['createdAt', 'DESC']],
                    limit: fileLimit,
                    offset: fileOffset
                })
            ]);

            // Convert to plain
            let files = fileResult.rows.map(f => f.get({ plain: true }));
            let folders = folderResult.rows.map(f => ({
                ...f.toJSON(),
                isFolder: true,
                type: 'folder'
            }));

            // Hydrate file URLs
            files = await hydrateFileFields(files, ["id"]);

            files = files.map(f => ({ ...f, isFolder: false, type: 'file' }));

            results.push(...folders, ...files);
            totalItems = folderResult.count + fileResult.count;
        }

        // Sort & return
        results.sort(sortItems);

        return {
            success: true,
            items: results,
            totalItems,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < Math.ceil(totalItems / limit),
                hasPrevPage: page > 1
            }
        };
    } catch (error) {
        console.error('searchInDatabase error:', error);
        return {
            success: false,
            message: 'Search failed',
            items: [],
            totalItems: 0
        };
    }
};
