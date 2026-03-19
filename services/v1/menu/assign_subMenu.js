'use strict';
const { MenuSubMenu } = require('../../../models');
const { delCache } = require('../../../utils/cacheManager');

module.exports = async (req) => {
    const { menuId, submenuIds } = req.body;
    if (!menuId) {
        throw new Error('Menu ID is required', 400);
    }
    if (!submenuIds || submenuIds.length === 0) {
        throw new Error('Cannot save empty assignments. Please assign at least one submenu.', 400);
    }

    await MenuSubMenu.destroy({ where: { menuId } });

    const assignments = submenuIds.map(submenuId => ({
        menuId: parseInt(menuId),
        subMenuId: parseInt(submenuId)
    }));

    await MenuSubMenu.bulkCreate(assignments);

    // Revalidate caches
    await delCache(req, 'Assign-menu:*', true);
    await delCache(req, 'menu-list:*', true);

    return { data: { status: true }, name: 'db' };
};
