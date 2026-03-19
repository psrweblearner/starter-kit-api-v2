// services/v1/fileManager/helpers/getParentFolderId.js
'use strict';
const { Folder } = require('../../../../models');
const path = require('path');

module.exports = async (fullPath, storageProvider) => {
    const parentPath = path.dirname(fullPath);

    if (parentPath === '.' || parentPath === '/') {
        return null;
    }

    const parentFolder = await Folder.findOne({
        where: {
            full_path: parentPath,
            storage_provider: storageProvider,
            is_active: true
        }
    });

    return parentFolder ? parentFolder.id : null;
};
