'use strict';
const { Category } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'category-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Category, req, key, {
        defaultAttributes: ["id", "name", "slug", "description", "parent_id", "color", "icon", "sort_order", "status", "createdBy", "createdAt"],
        order: [["sort_order", "ASC"], ["name", "ASC"]],
        include: [{ model: Category, as: 'parent', attributes: ['id', 'name', 'slug'] }]
    });
    if (!data) {
        throw new Error('Error fetching categories', 400);
    }
    return { data, name };
};
