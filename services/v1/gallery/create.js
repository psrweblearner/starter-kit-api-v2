'use strict';
const { Gallery } = require('../../../models');
module.exports = async (req) => {
    const { title, slug, description, file_id, alt, status } = req.body;
    const user = req.user?.id || 'system';
    const gallery = await Gallery.create({ title, slug, description, file_id, alt, status, createdBy: user });

    return { data: gallery };
};
