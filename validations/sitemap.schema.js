'use strict';

const { z } = require('zod');
const { domainField } = require('./shared.domain');

const generate = z.object({
  body: z.object({
    domain: domainField,
    includeImages: z.boolean().optional(),
    includeVideos: z.boolean().optional(),
    maxUrls: z.number().int().min(0).max(500000).optional(),
    maxDepth: z.number().int().min(1).max(10).optional(),
    concurrency: z.number().int().min(1).max(80).optional(),
  }).strict(),
});

module.exports = {
  generate,
};
