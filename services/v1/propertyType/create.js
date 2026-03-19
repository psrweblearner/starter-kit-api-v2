// services/v1/propertyType/create.js
'use strict';
const { PropertyType } = require('../../../models');
module.exports = async (req) => {
    const { title,slug,file_id,tagline,description,status } = req.body;
    const user = req.user?.id || 'system';
    await PropertyType.create({ title,slug,file_id,tagline,description,status,createdBy:user});
    return;
};
