'use strict';

const express = require('express');
// const apiProtect = require('../middleware/apiProtect');
const router = express.Router();

// API Versions
// router.use(apiProtect);
router.use('/v1', require('./v1'));
// router.use('/v2', require('./v2')); // future

module.exports = router;
