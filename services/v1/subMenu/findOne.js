'use strict';
const { SubMenu } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'menu-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(SubMenu, req, key, { 
        defaultAttributes: ["id","title","slug","icon","status","createdAt","updatedAt","createdBY"],
        where: { id },
     });
    if (!data) {
        throw new Error('Error fetching submenu', 400);
    }
    return { data, name };
};
