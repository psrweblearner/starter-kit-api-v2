// services/v1/amenities/create.js
'use strict';
const { Amenity } = require('../../../models');
module.exports = async (req) => {
    const { title,slug,icon} = req.body;
    const user = req.user?.id || 'system';
    await Amenity.create({ title,slug,icon,createdBy:user});
    return;
};
