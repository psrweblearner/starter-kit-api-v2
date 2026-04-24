'use strict';

const { z } = require('zod');
const { domainField } = require('./shared.domain');

const generate = z.object({
  body: z.object({
    domain: domainField,
    mode: z.enum(['mobile', 'desktop']).optional(),
  }).strict(),
});

module.exports = {
  generate,
};
