// services/v1/apiclient/create.js
'use strict';
const { Role } = require('../../../models');
module.exports = async (req) => {
    const { title, status = 1 } = req.body;
    const user = req.user?.id || 'system';
    await Role.create({ title, status, createdBy: user });
    return;
};
