// services/v1/tags/create.js
'use strict';
const { Tag } = require('../../../models');
module.exports = async (req) => {
    const { name, description, color, status } = req.body;
    const user = req.user?.id || 'system';
    await Tag.create({ name, description, color, status, createdBy: user });
    return;
};
