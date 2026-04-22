'use strict';

const { z } = require('zod');
const { domainField } = require('./shared.domain');

const generate = z.object({
  body: z.object({
    domain: domainField,
  }).strict(),
});

module.exports = {
  generate,
};
