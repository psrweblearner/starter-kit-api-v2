'use strict';

const { z } = require('zod');

const createRule = z.object({
  body: z.object({
    rule_name: z.string().trim().min(2).max(180),
    search_keywords: z.string().trim().min(1),
    locations: z.string().trim().min(1),
    min_rating: z.coerce.number().min(0).max(5).optional(),
    max_rating: z.coerce.number().min(0).max(5).optional(),
    min_reviews: z.coerce.number().int().min(0).optional(),
    max_reviews: z.coerce.number().int().min(0).optional(),
    phone_required: z.coerce.boolean().optional(),
    website_filter: z.enum(['WITH_WEBSITE', 'WITHOUT_WEBSITE', 'BOTH']).optional(),
    business_status: z.enum(['OPERATIONAL', 'CLOSED', 'BOTH']).optional(),
  }).strict(),
});

const withId = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const listLeads = z.object({
  query: z.object({
    ruleId: z.string().regex(/^\d+$/).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.union([z.string().regex(/^\d+$/), z.literal('all')]).optional(),
    search: z.string().trim().optional(),
  }),
});

module.exports = {
  createRule,
  withId,
  listLeads,
};
