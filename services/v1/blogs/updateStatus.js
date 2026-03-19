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
        throw new AppError('Forbidden: Only admins can update records', 403);
    }

    const { id } = req.params;
    const BlogData = await Blog.findByPk(id);
    if (!BlogData) {
        throw new AppError('Blog not found', 404);
    }

    // ✅ If trying to publish, validate required fields
    if (req.body.status === true) {
        const requiredFields = [
            'title',
            'description',
            'slug',
            'file_id',
            'tagline',
            'author'
        ];

        const missingFields = requiredFields.filter(field => !BlogData[field]);

        if (missingFields.length > 0) {
            throw new AppError(
                `Cannot publish. Missing required fields: ${missingFields.join(', ')}`,
                400
            );
        }
    }

    const updateData = { ...req.body };

    if (req.body.status === true) {
        updateData.publishedAt = new Date();
    }

    await BlogData.update(updateData);

    return { data: { status: true, data: BlogData } };
};