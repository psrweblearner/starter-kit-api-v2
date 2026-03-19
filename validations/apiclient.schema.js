'use strict';

const { z } = require('zod');

/**
 * Schema for creating a new API Client
 */
const create = z.object({
  body: z.object({
    name: z.string().min(3).max(255),
    domain: z.string().min(3).max(255),
    allow_all: z.boolean().optional().default(false),
    status: z.number().int().min(0).max(1).optional().default(1),
  }),
});

module.exports = {
  create,
};
