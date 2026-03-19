// services/v1/setting/create.js
'use strict';
const { Setting } = require('../../../models');
module.exports = async (req) => {
    console.log(req.body);
    const { title, value, type } = req.body;
    const user = req.user?.id || 'system';
    await Setting.create({ title, value, type, createdBy: user });
    return;
};
