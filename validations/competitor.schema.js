'use strict';

const { z } = require('zod');

const analyze = z.object({
  body: z.object({
    domain: z.string().trim().min(1, 'domain is required'),
    competitors: z.array(z.string().trim().min(1))
      .min(1, 'At least 1 competitor required')
      .max(10, 'Max 10 competitors allowed'),
  }).strict(),
});

module.exports = {
  analyze,
};