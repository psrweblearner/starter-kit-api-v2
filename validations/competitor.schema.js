'use strict';

const { z } = require('zod');
const { domainField } = require('./shared.domain');

const analyze = z.object({
  body: z.object({
    domain: domainField,
    businessName: z.string().trim().min(1).max(200).optional(),
    competitors: z.array(domainField)
      .min(1, 'At least 1 competitor required')
      .max(10, 'Max 10 competitors allowed'),
  }).strict(),
});

module.exports = {
  analyze,
};