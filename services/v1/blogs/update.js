'use strict';
const { Blog } = require('../../../models');
const { resolveConfig } = require('../../../utils/serviceHelper');
const AppError = require('../../../utils/AppError');
const polyService = require('../shared/PolymorphicRelationService');

const CONFIGS = {
    ADMIN: {}
};

module.exports = async (req) => {
    const config = resolveConfig(req, CONFIGS);

    if (config.platform !== 'ADMIN') {
        throw new AppError('Forbidden: Only admins can update records', 403);
    }

    const { id } = req.params;
    const blog = await Blog.findByPk(id);

    if (!blog) {
        throw new AppError('Blog not found', 404);
    }

    const { tags, categories, gallery, faqs, ...updateData } = req.body;

    await blog.update(updateData);
    // Update polymorphic relations if provided
    if (tags !== undefined) {
        await polyService.syncRelations(blog, 'tags', tags);
    }
    if (categories !== undefined) {
        await polyService.syncRelations(blog, 'categories', categories);
    }
    if (gallery !== undefined) {
        await polyService.syncRelations(blog, 'gallery', gallery);
    }
    if (faqs !== undefined) {
        await polyService.syncRelations(blog, 'faqs', faqs);
    }

    return { data: { status: true, data: blog } };
};

