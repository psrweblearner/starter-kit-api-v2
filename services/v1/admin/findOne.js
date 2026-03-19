'use strict';

const { AdminUser, Role, AdminUserRole, SubMenu, SpecialPermission, Menu, MenuSubMenu } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const { resolveConfig } = require('../../../utils/serviceHelper');
const CacheKey = 'admin-users-list:';
const CONFIGS = {
    ADMIN: {
        defaultAttributes: ["id", "firstName", "lastName", "email", "mobile", "profile", "address", "designation", "about"],
        protectedFields: ["password", "pwd"],
        fileFields: ["profile"],
        editDesc: 'about',
        defaultIncludes: [
            {
                model: Role,
                as: "roles",
                attributes: ["id", "title", "status"],
                through: { model: AdminUserRole, attributes: ['access'] },
                required: false,
                include: [
                    {
                        model: SubMenu,
                        as: "pages",
                        attributes: ["id", "title", "icon", "slug", "status"],
                        where: { status: 1 },
                        required: false,
                        through: { attributes: ['actions'] },
                    }
                ]
            },
        ],
    },

    PUBLIC: {
        defaultAttributes: ["firstName", "lastName", "profile", "about"],
        protectedFields: ["password", "email", "status", "pwd"],
        fileFields: ["profile"],
        editDesc: 'about',
        // ❌ No includes here
    }
};

module.exports = async (req) => {

    const config = resolveConfig(req, CONFIGS);
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(AdminUser, req, key, { ...config, where: { id } });

    if (!data || !data.data) {
        throw new Error('Admin User not found');
    }

    const user = data.data;

    // ===============================
    // ONLY FOR ADMIN PLATFORM
    // ===============================
    if (config.platform === 'ADMIN') {

        // 🔹 Apply Special Permissions
        const specialPermissions = await SpecialPermission.findAll({
            where: { adminUserId: id },
        });

        const spMap = {};
        specialPermissions.forEach(sp => {
            spMap[`${sp.roleId}_${sp.pageId}`] = sp.actions;
        });

        if (user.roles) {
            user.roles.forEach(role => {
                if (role.pages) {
                    role.pages.forEach(page => {
                        const key = `${role.id}_${page.id}`;
                        if (spMap[key]) {
                            page.Permission.actions = JSON.stringify(spMap[key]);
                        }
                    });
                }
            });
        }

        // 🔹 If Super Admin → get all menus
        const isAdmin = user.roles?.some(role =>
            (role.title || '').toLowerCase() === 'admin'
        );

        if (isAdmin) {
            const allSubmenus = await SubMenu.findAll({
                attributes: ["id", "title", "icon", "slug", "status"],
                where: { status: 1 },
                order: [['title', 'ASC']],
                include: [
                    {
                        model: Menu,
                        through: { model: MenuSubMenu, attributes: [] },
                        as: "menus",
                        attributes: ["id", "title", "icon", "slug", "status"],
                        where: { status: 1 }
                    }
                ]
            });

            data.allSubmenus = allSubmenus;
        }
    }

    return { data, name };
};
