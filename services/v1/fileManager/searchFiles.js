// services/v1/fileManager/searchFiles.js
'use strict';
const searchInDatabase = require('./helpers/searchInDatabase');

module.exports = async (req) => {
    const {
        query,
        page = 1,
        limit = 20,
        fileType = 'all',
        folderScope = 'false',
        exactMatch = 'false',
        currentFolder = ''
    } = req.query;

    if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
    }

    const filterKey = `${fileType}:${folderScope}:${exactMatch}:${currentFolder}`;

    const searchOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
        fileType: fileType,
        folderScope: folderScope === 'true',
        exactMatch: exactMatch === 'true',
        currentFolder: currentFolder
    };

    const searchResults = await searchInDatabase(query.trim(), searchOptions);

    if (!searchResults.success) {
        throw new Error(searchResults.error || 'Failed to search files');
    }

    const response = {
        items: searchResults.items || [],
        totalItems: searchResults.totalItems || 0,
        query: query.trim(),
        filters: {
            fileType: fileType,
            folderScope: folderScope === 'true',
            exactMatch: exactMatch === 'true',
            currentFolder: currentFolder
        },
        pagination: {
            currentPage: parseInt(page),
            totalPages: searchResults.pagination?.totalPages || Math.ceil((searchResults.totalItems || 0) / parseInt(limit)),
            totalItems: searchResults.totalItems || 0,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < (searchResults.pagination?.totalPages || Math.ceil((searchResults.totalItems || 0) / parseInt(limit))),
            hasPrevPage: parseInt(page) > 1
        }
    };

    return { data: response, name: 'searchFiles' };
};
