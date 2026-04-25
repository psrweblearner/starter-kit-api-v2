'use strict';

const { z } = require('zod');

const withId = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const create = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
    urls: z.array(z.string().trim().min(1)).min(1).max(120),
  }).strict(),
});

const update = z.object({
  params: withId.shape.params,
  body: z.object({
    name: z.string().trim().min(1).max(150).optional(),
    urls: z.array(z.string().trim().min(1)).min(1).max(120).optional(),
  }).strict().refine((value) => value.name !== undefined || value.urls !== undefined, {
    message: 'At least one field is required',
  }),
});

module.exports = {
  create,
  update,
  withId,
};
