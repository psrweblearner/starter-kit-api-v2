'use strict';

const { z } = require('zod');
const { normalizeDomain } = require('../utils/domain');

const domainField = z
  .string()
  .trim()
  .min(1, 'domain is required')
  .transform((value) => normalizeDomain(value))
  .refine((value) => !!value, {
    message: 'Invalid domain. Use a valid hostname like example.com',
  });

module.exports = {
  domainField,
};
