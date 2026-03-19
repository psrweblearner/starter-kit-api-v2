// services/v1/floorPlan/create.js
'use strict';
const { Floorplan } = require('../../../models');
module.exports = async (req) => {
    const { tagline, bedroom,bathroom,amount,area,parking,file_id,status } = req.body;
    const user = req.user?.id || 'system';
    await Floorplan.create({ tagline, bedroom,bathroom,amount,area,parking,file_id,status,createdBy:user});
    return;
};
