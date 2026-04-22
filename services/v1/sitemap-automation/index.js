'use strict';

const siteService = require('./site.service');
const { enqueueAutomationRun } = require('./enqueue-run.service');
const runAutomation = require('./run-automation.service');
const { startScheduler, processDueSites } = require('./scheduler.service');

module.exports = {
  ...siteService,
  enqueueAutomationRun,
  runAutomation,
  startScheduler,
  processDueSites,
};
