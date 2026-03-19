// services/v1/developer/create.js
'use strict';
const { Developer } = require('../../../models');
module.exports = async (req) => {
    const { name,slug,logo,tagline,description,status } = req.body;
    const user = req.user?.id || 'system';
    await Developer.create({ name,slug,logo,tagline,description,status,createdBy:user});
    return;
};
