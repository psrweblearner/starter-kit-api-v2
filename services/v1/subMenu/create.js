// services/v1/apiclient/create.js
'use strict';
const { SubMenu } = require('../../../models');
module.exports = async (req) => {
    const { title,slug,icon} = req.body;
    const user = req.user?.id || 'system';
    await SubMenu.create({ title,slug,icon,createdBy:user});
    return;
};
