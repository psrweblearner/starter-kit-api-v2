'use strict';
require('dotenv').config({ override: process.env.NODE_ENV !== 'production' });

const { getJobsQueue } = require('./connection');

const sitemapQueue = getJobsQueue();

module.exports = sitemapQueue;
