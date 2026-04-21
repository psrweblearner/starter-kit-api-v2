'use strict';
const analyzeQueue = require('../../../utils/queue/analyze.queue');
module.exports = async (req) => {
  const { domain, competitors } = req.body;

  const cleanDomain = normalizeDomain(domain);
  const cleanCompetitors = competitors.map(normalizeDomain);

  const job = await analyzeQueue.add('analyze-job', {
    domain: cleanDomain,
    competitors: cleanCompetitors,
  });
  return {
    jobId: job.id,
    status: 'processing'
  };
};


const normalizeDomain = (input) => {
  if (!input) return '';

  return input
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();
};