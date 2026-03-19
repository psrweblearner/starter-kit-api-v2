'use strict';

/**
 * Resolves the service configuration based on the request context.
 * @param {Object} req - Express request object.
 * @param {Object} configs - Object containing configurations for ADMIN and PUBLIC.
 * @returns {Object} The resolved configuration including the platform identity.
 */
exports.resolveConfig = (req, configs) => {
    const isLogged = !!req.user;
    const platform = isLogged ? 'ADMIN' : 'PUBLIC';
    const config = configs[platform];
    if (!config) {
        throw new Error(`Service configuration missing for platform: ${platform}`);
    }

    return {
        ...config,
        platform
    };
};
