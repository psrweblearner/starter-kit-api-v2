'use strict';

const AppError = require('../utils/AppError');

/**
 * Higher-order middleware to validate request data against a Zod schema.
 * @param {Object} schema - Zod schema to validate against (can contain body, query, params).
 */
module.exports = (schema) => async (req, res, next) => {
  try {
    const validatedData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace original data with validated/transformed data
    if (validatedData.body) req.body = validatedData.body;

    // Mutate query and params because they are read-only getters in Express 5
    if (validatedData.query) {
      Object.keys(req.query).forEach(key => delete req.query[key]);
      Object.assign(req.query, validatedData.query);
    }

    if (validatedData.params) {
      // Note: params are usually handled by the router, but we can sync them
      Object.keys(req.params).forEach(key => delete req.params[key]);
      Object.assign(req.params, validatedData.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};
