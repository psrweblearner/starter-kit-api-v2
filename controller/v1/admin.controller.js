'use strict';
const services = require('../../services/v1');
const { delCache } = require('../../utils/cacheManager');
const CacheKey = 'admin-users-list:*'
exports.findAll = async (req, res) => {
    const { data, name } = await services.admin.findAll(req);
    res.status(200).json({ message: 'Admin Users fetched successfully', ...data, name });
}

exports.findOne = async (req, res) => {
    const { data, name } = await services.admin.findOne(req);
    res.status(200).json({ message: 'Admin User fetched successfully', ...data, name });
}

exports.update = async (req, res) => {
    const { data, name } = await services.admin.update(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Admin User updated successfully', ...data, name });
}
exports.toggle = async (req, res) => {
    const { data, name } = await services.admin.toggle(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Admin User status updated successfully', ...data, name });
}
exports.delete = async (req, res) => {
    const { data, name } = await services.admin.delete(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Admin User deleted successfully', ...data, name });
}
exports.assignRoleUser = async (req, res) => {
    const { data, name } = await services.admin.assignRoleUser(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Role assigned to user successfully', ...data, name });
}
exports.assignSpecialPermission = async (req, res) => {
    const { data, name } = await services.admin.assignSpecialPermission(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Special permissions assigned to user successfully', ...data, name });
}
exports.resetSpecialPermissions = async (req, res) => {
    const { data, name } = await services.admin.resetSpecialPermissions(req);
    await delCache(req, CacheKey, true);
    res.status(200).json({ message: 'Special permissions reset successfully', ...data, name });
}