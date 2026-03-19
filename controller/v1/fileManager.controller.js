'use strict';
const services = require('../../services/v1');
const multer = require('multer');
const { delCache, refreshConfigs } = require('../../utils/cacheManager');
const CacheKey = 'file-folder-list:*';

// Multer middleware configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { cb(null, true); }
});
// Folder operations
exports.createFolder = async (req, res) => {
    const { data, name } = await services.fileManager.createFolder(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ status: true, message: 'Folder created successfully', ...data, name });
};
exports.findAllFolder = async (req, res) => {
    const { data, name } = await services.fileManager.findAllFolder(req);
    res.status(200).json({ status: true, ...data, name });
};
exports.removeFolder = async (req, res) => {
    const { data, name } = await services.fileManager.removeFolder(req);
    await refreshConfigs();
    res.status(200).json({ status: true, message: 'Folder and all nested contents deleted successfully', ...data, name });
};

exports.renameFolder = async (req, res) => {
    const { data, name } = await services.fileManager.renameFolder(req);
    await refreshConfigs();
    res.status(200).json({ status: true, message: 'Folder renamed successfully', ...data, name });
};

// File operations
exports.findAllFiles = async (req, res) => {
    const { data, name } = await services.fileManager.findAllFiles(req);
    res.status(200).json({ status: true, ...data, name });
};

exports.uploadFile = async (req, res) => {
    const { data, name } = await services.fileManager.uploadFile(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ status: true, message: 'File uploaded successfully', ...data, name });
};

exports.deleteFile = async (req, res) => {
    const { data, name } = await services.fileManager.deleteFile(req);
    await refreshConfigs();
    res.status(200).json({ status: true, message: 'File deleted successfully', ...data, name });
};
exports.renameFile = async (req, res) => {
    const { data, name } = await services.fileManager.renameFile(req);
    await refreshConfigs();
    res.status(200).json({ status: true, message: 'File renamed successfully', ...data, name });
};

exports.searchFiles = async (req, res) => {
    const { data, name } = await services.fileManager.searchFiles(req);
    res.status(200).json({ status: true, ...data, name });
};

// Storage operations
exports.getStorageInfo = async (req, res) => {
    const { data, name } = await services.fileManager.getStorageInfo(req);
    res.status(200).json({ status: true, message: `Currently using ${data.providerName} storage`, ...data, name });
};

exports.syncStorage = async (req, res) => {
    const { data, name } = await services.fileManager.syncStorage(req);
    res.status(200).json({ status: true, message: `Storage sync completed successfully for ${data.syncedFolder}`, ...data, name });
};

// Download zip - special case that writes directly to response
exports.downloadZip = async (req, res) => {
    await services.fileManager.downloadZip(req, res);
};

// Chunked upload operations
exports.uploadChunkFile = async (req, res) => {
    const { data, name } = await services.fileManager.uploadChunkFile(req, res);
    res.status(200).json({ success: true, ...data, name });
};

exports.mergeChunksFile = async (req, res) => {
    const { data, name } = await services.fileManager.mergeChunksFile(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ success: true, ...data, name });
};

// Export multer middleware for routes
exports.upload = upload;