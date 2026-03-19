// services/v1/apiclient/create.js
'use strict';
const { Menu } = require('../../../models');
module.exports = async (req) => {
    const { title,slug,icon,image } = req.body;
    const user = req.user?.id || 'system';
    await Menu.create({ title,slug,icon,image,createdBy:user});
    return;
};
