'use strict';
const { Category } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'category-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Category, req, key, {
        defaultAttributes: ["id", "name", "slug", "description", "parent_id", "color", "icon", "sort_order", "status", "createdBy", "createdAt", "updatedAt"],
        where: { id },
        include: [
            {
                model: Category,
                as: 'parent',
                attributes: ['id', 'name', 'slug']
            },
            {
                model: Category,
                as: 'children',
                attributes: ['id', 'name', 'slug', 'description', 'color', 'status']
            }
        ]
    });
    if (!data) {
        throw new Error('Error fetching category', 400);
    }
    return { data, name };
};
