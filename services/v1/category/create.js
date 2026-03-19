// services/v1/category/create.js
'use strict';
const { Category } = require('../../../models');
module.exports = async (req) => {
    const { name, description, parent_id, color, icon, sort_order, status } = req.body;
    const user = req.user?.id || 'system';
    const parentId = (parent_id && parent_id !== '' && parent_id !== '0') ? parseInt(parent_id) : null;
    if (parentId) {
        const parentCategory = await Category.findByPk(parentId);
        if (!parentCategory) {
            throw new Error('Parent category not found');
        }
    }
    await Category.create({ name, description, parent_id: parentId, color, icon, sort_order: parseInt(sort_order) || 0, status, createdBy: user });
    return;
};
