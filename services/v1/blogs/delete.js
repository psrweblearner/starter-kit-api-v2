'use strict';
const { Blog } = require('../../../models');
const { resolveConfig } = require('../../../utils/serviceHelper');
const AppError = require('../../../utils/AppError');

const CONFIGS = {
    ADMIN: {}
};

module.exports = async (req) => {
    const config = resolveConfig(req, CONFIGS);
    if (config.platform !== 'ADMIN') {
        throw new AppError('Forbidden: Only admins can delete records', 403);
    }

    const { id } = req.params;
    const blog = await Blog.findByPk(id);

    if (!blog) {
        throw new AppError('Blog not found', 404);
    }

    await blog.destroy();

    return { data: { status: true, message: 'Blog deleted successfully' } };
};
