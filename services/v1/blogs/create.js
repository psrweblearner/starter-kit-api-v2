'use strict';
const { Blog } = require('../../../models');
const polyService = require('../shared/PolymorphicRelationService');

module.exports = async (req) => {
    const { title, categories, tags, gallery, faqs, author, description, tagline, slug, file_id } = req.body;
    const user = req.user?.id || 'system';

    const blog = await Blog.create({
        title,
        author,
        description,
        tagline,
        slug,
        file_id,
        createdBy: user
    });

    // Handle polymorphic relations
    if (tags) {
        await polyService.syncRelations(blog, 'tags', tags);
    }
    if (categories) {
        await polyService.syncRelations(blog, 'categories', categories);
    }
    if (gallery) {
        await polyService.syncRelations(blog, 'gallery', gallery);
    }
    if (faqs) {
        await polyService.syncRelations(blog, 'faqs', faqs);
    }

    return { data: blog };
};

