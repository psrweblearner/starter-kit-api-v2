'use strict';

const express = require('express');
const ctr = require('../controller/v1');
const validate = require('../middleware/validate');
const schema = require('../validations');
const adminAuth = require('../middleware/adminAuth');

module.exports = {
    router: () => express.Router(),
    group: (parent, middleware, cb) => {
        const sub = express.Router();
        // Support optional middleware: group(router, cb)
        if (typeof middleware === 'function' && !cb) {
            cb = middleware;
            middleware = null;
        }
        if (middleware) {
            sub.use(middleware);
        }
        cb(sub);
        parent.use(sub);
    },
    ctr,
    validate,
    schema,
    adminAuth: adminAuth.protect
};
