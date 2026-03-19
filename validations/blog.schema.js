'use strict';

const { z } = require('zod');

/**
 * Schema for User Registration
 */
const create = z.object({
    body: z.object({
        title: z.string().min(3).max(50),
        slug: z.string().min(3).max(50),
        author: z.string(),
        categories: z.string(),
        tags: z.string(),
        tagline: z.string().min(3).max(50),
    }).strict()
});

const update = z.object({
    body: z.object({
        title: z.string().min(3).max(50),
        slug: z.string().min(3).max(50),
        tagline: z.string().min(3).max(50),
        description: z.string().min(3).max(50),
    }).strict()
});

const findOne = z.object({
    params: z.object({
        id: z.string().min(24).max(24),
    })
});

const findAll = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        search: z.string().optional(),
        sort: z.string().optional(),
        sortBy: z.string().optional(),
    })
});

module.exports = {
    create,
    update,
    findOne,
    findAll,
};
