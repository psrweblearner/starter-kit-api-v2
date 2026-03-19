// services/v1/city/create.js
'use strict';
const { City } = require('../../../models');
module.exports = async (req) => {
    const { name,slug,file_id,tagline,description,country,state,status,is_prominent } = req.body;
    const user = req.user?.id || 'system';
    await City.create({ name,slug,file_id,tagline,description,country,state,status,is_prominent,createdBy:user});
    return;
};
