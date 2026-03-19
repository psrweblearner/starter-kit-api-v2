'use strict';
const { SubMenu } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'submenu-list:'
module.exports = async (req) => {
    const key = `${CacheKey}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(SubMenu, req, key, {
        defaultAttributes: ["id", "title", "slug", "icon", "status", "createdAt", "updatedAt", "createdBy", "modifyBy"],
        userFields: ["createdBy", "modifyBy"],
        order: [["id", "DESC"]],
    });

    if (!data) {
        throw new Error('Error fetching submenus', 400);
    }
    return { data, name };
};
