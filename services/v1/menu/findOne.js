'use strict';
const { Menu } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'menu-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Menu, req, key, { 
        defaultAttributes: ["id","title","slug","icon","image","status","createdAt","updatedAt","createdBY"],
        where: { id },
        fileFields: ["image"],
     });
    if (!data) {
        throw new Error('Error fetching menu', 400);
    }
    return { data, name };
};
