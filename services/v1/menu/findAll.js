'use strict';
const { Menu } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'menu-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Menu, req, key, { 
        defaultAttributes: ["id","title","slug","image","icon","status","createdAt","updatedAt","createdBY"],
        fileFields: ["image"],
        order: [["id", "DESC"]], });
    if (!data) {
        throw new Error('Error fetching menus', 400);
    }
    return { data, name };
};
