'use strict';

const PLAN_CONFIG = {
  FREE: {
    maxCompetitors: 3,
    scrapeDepth: 'basic',
    aiMode: 'summary',
    useSerpApi: false,
    dailyRequestLimit: 2,
  },
  PAID: {
    maxCompetitors: 10,
    scrapeDepth: 'full',
    aiMode: 'detailed',
    useSerpApi: true,
    dailyRequestLimit: 100,
  },
};

const getPlanConfig = (userPlan = 'FREE') => {
  const normalizedPlan = String(userPlan || 'FREE').trim().toUpperCase();
  return PLAN_CONFIG[normalizedPlan] || PLAN_CONFIG.FREE;
};

module.exports = {
  PLAN_CONFIG,
  getPlanConfig,
};
