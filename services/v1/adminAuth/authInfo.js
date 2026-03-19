'use strict';

const { AuthUserView } = require('../../../models');
module.exports = async (req) => {
    const { adminUserId, roleId } = req.query;
    if (!adminUserId || !roleId) {
        throw new Error('adminUserId and roleId are required');
    }
    // ==================== Fetch User Data from View ====================
    const rows = await AuthUserView.findAll({
        where: { adminUserId },
        order: [['pageTitle', 'ASC']]
    });

    if (!rows || rows.length === 0) {
        throw new Error('User not found or inactive');
    }
    // ==================== Build User Object ====================
    const user = buildUserObject(rows);
    // ==================== Process Roles & Permissions ====================
    // Normalize roles structure
    user.roles = normalizeRoles(user.roles);
    const activeRole = user.roles?.find(r => String(r.id) === String(roleId));
    if (!activeRole) {
        throw new Error('Role not found or unauthorized');
    }
    const isAdmin = (activeRole.title || '').toLowerCase() === 'admin';
    user.access = activeRole.access || 'own';
    let pages = activeRole.pages || [];
    // ==================== Inject Dashboard ====================
    pages = injectDashboard(pages, isAdmin);
    // ==================== Build Navigation & Permissions ====================
    const groupsMap = buildMenuGroups(pages);
    const permissions = buildPermissionsMap(pages, isAdmin);
    
    // ==================== Attach to Result ====================
    user.pages = pages;
    user.groups = Object.values(groupsMap);
    user.permissions = permissions;

    return user;
};

function buildUserObject(rows){
    const row = rows[0];
    const user = {
        id: row.adminUserId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        mobile: row.mobile,
        profile: row.profile,
        address: row.address,
        designation: row.designation,
        about: row.about,
        status: row.userStatus,
        roles: []
    };
    const rolesMap = {};
    rows.forEach(row => {
        if (!row.roleId) return;

        const roleId = String(row.roleId);

        // Initialize role if not exists
        if (!rolesMap[roleId]) {
            rolesMap[roleId] = {
                id: row.roleId,
                title: row.roleTitle,
                status: row.roleStatus,
                AdminUserRole: { access: row.roleAccess },
                pages: []
            };
        }

        // Add page to role
        if (row.pageId) {
            addPageToRole(rolesMap[roleId], row);
        }
    });

    user.roles = Object.values(rolesMap);
    return user;
}
/**
 * Adds a page to a role, handling menus and actions
 */
function addPageToRole(role, row) {
    const pageId = String(row.pageId);
    let page = role.pages.find(p => String(p.id) === pageId);

    if (!page) {
        // Parse actions (special permissions override role permissions)
        const actions = parseActions(row.specialActions || row.pageActions);

        page = {
            id: row.pageId,
            title: row.pageTitle,
            icon: row.pageIcon,
            slug: row.pageSlug,
            status: row.pageStatus,
            Permission: { actions },
            menus: []
        };
        role.pages.push(page);
    }

    // Add menu if exists and not already added
    if (row.menuId && !page.menus.find(m => String(m.id) === String(row.menuId))) {
        page.menus.push({
            id: row.menuId,
            title: row.menuTitle,
            icon: row.menuIcon,
            slug: row.menuSlug,
            status: row.menuStatus
        });
    }
}

/**
 * Parses action permissions (handles JSON strings)
 */
function parseActions(actions) {
    if (!actions) return [];

    if (typeof actions === 'string') {
        try {
            return JSON.parse(actions);
        } catch (e) {
            console.error('Error parsing actions:', e);
            return [];
        }
    }

    return actions;
}

/**
 * Normalizes roles by removing pivot data and flattening structure
 */
function normalizeRoles(roles) {
    return roles?.map(role => {
        const normalized = { ...role };
        normalized.access = role.AdminUserRole?.access || 'own';
        delete normalized.AdminUserRole;

        normalized.pages = normalized.pages?.map(page => {
            const normalizedPage = { ...page };
            normalizedPage.actions = page.Permission?.actions || [];
            delete normalizedPage.Permission;
            normalizedPage.menus = page.menus?.map(menu => ({ ...menu })) || [];
            return normalizedPage;
        }) || [];

        return normalized;
    }) || [];
}

/**
 * Injects Dashboard page if not already present
 */
function injectDashboard(pages, isAdmin) {
    if (pages.some(p => p.slug === 'dashboard')) {
        return pages;
    }

    const dashboard = {
        id: 0,
        title: 'Dashboard',
        icon: 'fa-solid fa-gauge',
        slug: 'dashboard',
        status: 1,
        actions: isAdmin ? ['create', 'read', 'update', 'delete', 'download'] : ['read'],
        access: isAdmin ? 'full' : 'own',
        menus: []
    };

    return [dashboard, ...pages];
}

/**
 * Groups pages by menu for sidebar navigation
 */
function buildMenuGroups(pages) {
    const groupsMap = {};

    pages.forEach(page => {
        if (!page.menus || page.menus.length === 0) return;

        page.menus.forEach(menu => {
            const menuId = String(menu.id);
            if (!groupsMap[menuId]) {
                groupsMap[menuId] = { ...menu, pages: [] };
            }

            // Critical de-duplication: Ensure page is not added multiple times to the same group
            const alreadyExists = groupsMap[menuId].pages.some(p => String(p.id) === String(page.id));
            if (!alreadyExists) {
                groupsMap[menuId].pages.push(page);
            }
        });
    });

    return groupsMap;
}

/**
 * Builds permissions dictionary (slug -> actions mapping)
 */
function buildPermissionsMap(pages, isAdmin) {
    const permissions = {};

    pages.forEach(page => {
        if (page.slug) {
            permissions[page.slug] = page.actions || [];
        }
    });

    permissions['dashboard'] = isAdmin
        ? ['create', 'read', 'update', 'delete', 'download']
        : ['read'];

    return permissions;
}