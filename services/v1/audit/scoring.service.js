'use strict';

const WEIGHTS = {
  performance: 30,
  seo: 30,
  tracking: 10,
  localSeo: 10,
  bestPracticesSecurity: 20,
};

function clampScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

module.exports = function buildScores(modules) {
  const performance = clampScore(modules?.performance?.score);
  const seoTech = clampScore(modules?.technicalSeo?.score);
  const content = clampScore(modules?.contentQuality?.score);
  const seo = Math.round((seoTech + content) / 2);
  const tracking = clampScore(modules?.trackingStack?.score);
  const localSeo = clampScore(modules?.localSeo?.score);
  const bestPracticesBase = clampScore(modules?.performance?.categories?.bestPractices);
  const security = clampScore(modules?.securityTech?.score);
  const bestPracticesSecurity = Math.round((bestPracticesBase + security) / 2);

  const overallScore = Math.round(
    (performance * WEIGHTS.performance
      + seo * WEIGHTS.seo
      + tracking * WEIGHTS.tracking
      + localSeo * WEIGHTS.localSeo
      + bestPracticesSecurity * WEIGHTS.bestPracticesSecurity) / 100
  );

  return {
    weights: WEIGHTS,
    overallScore,
    categories: {
      performance,
      seo,
      tracking,
      localSeo,
      bestPracticesSecurity,
    },
  };
};
