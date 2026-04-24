'use strict';

const { z } = require('zod');
const { normalizeAutomationHost } = require('../utils/automationHost');

const siteIdParam = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const upsertSite = z.object({
  body: z.object({
    domain: z
      .string()
      .trim()
      .min(1, 'domain is required')
      .transform((value) => normalizeAutomationHost(value))
      .refine((value) => !!value, {
        message: 'Invalid domain. Use a valid hostname like example.com, localhost, localhost:3001, or 127.0.0.1',
      }),
    googleIndexEnabled: z.boolean().optional(),
    googleProperty: z.string().trim().max(255).optional(),
    indexApiConfigRef: z.string().trim().max(255).optional(),
    publishEndpoint: z.string().trim().max(500).optional(),
    publishSecret: z.string().trim().max(255).optional(),
    publishPath: z.string().trim().max(255).optional(),
  }).strict(),
});

const saveSchema = z.object({
  params: siteIdParam.shape.params,
  body: z.object({
    schemaMarkupText: z.string().max(200000).optional().default(''),
  }).strict(),
});

const saveCron = z.object({
  params: siteIdParam.shape.params,
  body: z.object({
    cronExpression: z.string().trim().min(0).max(120),
  }).strict(),
});

const savePublishConfig = z.object({
  params: siteIdParam.shape.params,
  body: z.object({
    publishEndpoint: z.string().trim().max(500).optional(),
    publishSecret: z.string().trim().max(255).optional(),
    publishPath: z.string().trim().max(255).optional(),
  }).strict(),
});

const checkDomainEligibility = z.object({
  body: z.object({
    domain: z
      .string()
      .trim()
      .min(1, 'domain is required')
      .transform((value) => normalizeAutomationHost(value))
      .refine((value) => !!value, {
        message: 'Invalid domain. Use a valid hostname like example.com, localhost, localhost:3001, or 127.0.0.1',
      }),
  }).strict(),
});

const withSiteId = siteIdParam;

module.exports = {
  upsertSite,
  withSiteId,
  checkDomainEligibility,
  saveSchema,
  saveCron,
  savePublishConfig,
};
