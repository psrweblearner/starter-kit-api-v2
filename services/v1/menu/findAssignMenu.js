'use strict';
const { Menu, SubMenu, MenuSubMenu } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const CacheKey = 'Assign-menu:*'
module.exports = async (req) => {
    const key = `${CacheKey.replace('*', '')}${JSON.stringify(req.query)}`;
    const { data, name } = await listQuery(Menu, req, key, {
        defaultAttributes: ["id", "title", "slug", "icon", "status"],
        order: [["id", "DESC"]],
        defaultIncludes: [
            {
                model: SubMenu,
                as: "submenus",
                attributes: ["id", "title", "slug", "icon", "status"],
                through: { model: MenuSubMenu, attributes: [] },
            },
        ],
    });
    if (!data) {
        throw new Error('Error fetching menus', 400);
    }
    return { data, name };
};
