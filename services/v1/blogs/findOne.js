'use strict';
const { Blog, Gallery, Faq, Category, Tag } = require('../../../models');
const { detailQuery } = require('../../../utils/build_query');
const CacheKey = 'blogs-list:'
module.exports = async (req) => {
  const { id } = req.params;
  const key = `${CacheKey}${id}${JSON.stringify(req.query)}`;
  let where = {};
  if (/^\d+$/.test(id)) { where.id = id; } else { where.slug = id; }
  const { data, name } = await detailQuery(Blog, req, key, {
    defaultAttributes: ["*", "file_id"],
    where,
    editDesc: 'description',
    fileFields: ["file_id"],
    defaultIncludes: [

      {
        model: Category,
        as: 'categories',
        attributes: ['id', 'name', 'slug'], // choose what you want
        through: { attributes: [] }, // hide pivot table fields
      },
      {
        model: Tag,
        as: 'tags',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
      },
      {
        model: Faq,
        as: 'faqs',
        attributes: ['id', 'question', 'ans'],
        through: { attributes: [] },
      },
      {
        model: Gallery,
        as: 'galleries',
        attributes: ['id', 'title', 'description', 'file_id'],
        fileFields: ["file_id"],
        through: { attributes: [] },
      },

    ]
  });
  if (!data) {
    throw new Error('Error fetching blog', 400);
  }
  return { data, name };
};
