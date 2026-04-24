'use strict';

const { z } = require('zod');
const { domainField } = require('./shared.domain');

const run = z.object({
  body: z.object({
    domain: domainField,
    businessName: z.string().trim().min(1).max(200).optional(),
    competitors: z.array(domainField).max(10, 'Max 10 competitors allowed').optional().default([]),
    mode: z.enum(['mobile', 'desktop']).optional().default('mobile'),
  }).strict(),
});

module.exports = {
  run,
};
