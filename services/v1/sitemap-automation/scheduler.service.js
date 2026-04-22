'use strict';

const { Op } = require('sequelize');
const { AutomationSite, AutomationRun } = require('../../../models');
const { enqueueAutomationRun } = require('./enqueue-run.service');
const { computeNextRunAt } = require('./cron-utils');

const TICK_MS = 60 * 1000;
let intervalId = null;
let isTicking = false;

async function processDueSites() {
  if (isTicking) return;
  isTicking = true;

  try {
    const now = new Date();
    const dueSites = await AutomationSite.findAll({
      where: {
        isConnected: true,
        cronExpression: { [Op.ne]: null },
        nextRunAt: { [Op.lte]: now },
      },
      limit: 25,
      order: [['next_run_at', 'ASC']],
    });

    for (const site of dueSites) {
      const activeRun = await AutomationRun.findOne({
        where: {
          siteId: Number(site.id),
          status: { [Op.in]: ['queued', 'processing'] },
        },
      });
      const nextRunAt = computeNextRunAt(site.cronExpression, now);

      if (!activeRun) {
        await enqueueAutomationRun(site, { triggerType: 'cron' });
      }

      await site.update({ nextRunAt });
    }
  } catch (error) {
    console.error('[sitemap-automation] scheduler tick failed:', error?.message || error);
  } finally {
    isTicking = false;
  }
}

function startScheduler() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    void processDueSites();
  }, TICK_MS);
  void processDueSites();
}

module.exports = {
  startScheduler,
  processDueSites,
};
