'use strict';

const runPageSpeed = require('../../pagespeed/run-pagespeed.service');

module.exports = async function performanceModule({ domain, mode }) {
  const ps = await runPageSpeed({ domain, mode });
  const summary = ps?.summary || {};
  const report = ps?.report || {};
  const opportunities = Array.isArray(report.opportunities) ? report.opportunities.slice(0, 12) : [];
  const issues = opportunities
    .filter((item) => typeof item?.score === 'number' && item.score < 90)
    .slice(0, 8)
    .map((item) => ({
      severity: item.score < 50 ? 'critical' : 'warning',
      title: item.title || item.id || 'Performance issue',
      detail: item.displayValue || item.description || 'Optimization opportunity found.',
    }));

  return {
    status: ps?.status === 'completed' ? 'completed' : 'partial',
    score: typeof summary.performance === 'number' ? summary.performance : null,
    categories: {
      performance: summary.performance ?? null,
      accessibility: summary.accessibility ?? null,
      bestPractices: summary.bestPractices ?? null,
      seo: summary.seo ?? null,
    },
    coreWebVitals: summary.coreWebVitals || null,
    opportunities,
    diagnostics: report.diagnostics || [],
    issues,
    raw: ps?.raw || null,
    error: ps?.error || null,
  };
};
