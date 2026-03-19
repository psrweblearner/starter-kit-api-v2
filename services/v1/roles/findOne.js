'use strict';
const { Role,SubMenu } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'roles-list:'
module.exports = async (req) => {
    const { id } = req.params;
    const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
    const { data, name } = await detailQuery(Role, req, key, { 
        defaultAttributes: ["id", "title", "status"], 
        where: { id },
        defaultIncludes: [
        {
          model: SubMenu,
          as: "pages",
          attributes: ["id", "title", "icon", "slug", "status"],
          where: { status: 1 },
          through: { attributes: ['actions'] },
          required: false,
          
        },
      ],
     });
    if (!data) {
        throw new Error('Error fetching role', 400);
    }
    return { data, name };
};
