const { AdminUser, Role, AdminUserRole } = require('../../../models');
const { listQuery } = require('../../../utils/build_query');
const { resolveConfig } = require('../../../utils/serviceHelper');
const CacheKey = 'admin-users-list:';
const CONFIGS = {
    ADMIN: {
        defaultAttributes: ["*","profile"],
        protectedFields: ["password"],
        fileFields: ["profile"],
        userFields: ["createdBy", "modifyBy"],
        defaultIncludes: [
            {
                model: Role,
                as: "roles",
                attributes: ["id", "title", "status"],
                through: { model: AdminUserRole, attributes: [] },
            },
        ],
    },
    PUBLIC: {
        defaultAttributes: ["firstName", "lastName", "profile"],
        protectedFields: ["password", "email", "status", "pwd"],
        fileFields: ["profile"],
    }
};

module.exports = async (req) => {
    const config = resolveConfig(req, CONFIGS);

    // Generate dynamic cache key using platform and sorted query params
    const queryPart = Object.keys(req.query).length ? ':' + JSON.stringify(req.query, Object.keys(req.query).sort()) : '';
    const dynamicKey = `${CacheKey}${config.platform}${queryPart}`;

    const { data, name } = await listQuery(AdminUser, req, dynamicKey, config);

    if (!data) {
        throw new Error('Error fetching Admin Users', 400);
    }
    return { data, name };
};
