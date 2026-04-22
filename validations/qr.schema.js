'use strict';

const { z } = require('zod');

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Invalid hex color');

const generate = z.object({
  body: z.object({
    content: z.string().trim().min(1, 'content is required').max(3000),
    width: z.number().int().min(120).max(1200).optional(),
    darkColor: hexColor.optional(),
    lightColor: hexColor.optional(),
    margin: z.number().int().min(0).max(8).optional(),
    fileName: z.string().trim().min(1).max(80).optional(),
  }).strict(),
});

module.exports = {
  generate,
};
