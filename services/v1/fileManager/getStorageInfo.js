// services/v1/fileManager/getStorageInfo.js
'use strict';
const storageService = require('../../../utils/file-manager/storageService');

module.exports = async (req) => {
    if (!storageService) {
        throw new Error('No storage provider configured');
    }

    const providerName = storageService.getProviderName();
    const cloudConfig = storageService.getConfig?.() || {};

    return {
        data: {
            storageProvider: providerName.toLowerCase(),
            providerName: providerName.charAt(0).toUpperCase() + providerName.slice(1),
            cloudConfig: cloudConfig
        },
        name: 'getStorageInfo'
    };
};
