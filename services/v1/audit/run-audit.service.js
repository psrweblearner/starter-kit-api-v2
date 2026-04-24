'use strict';

const pageSpeed = require('../competitor/pagespeed.service');
const scrape = require('../competitor/scrape.service');
const technicalChecks = require('../competitor/sitemap.service');
const googleMaps = require('../competitor/googlemaps.service');
const performanceModule = require('./modules/performance.module');
const localSeoModule = require('./modules/local-seo.module');
const technicalSeoModule = require('./modules/technical-seo.module');
const trackingStackModule = require('./modules/tracking-stack.module');
const contentQualityModule = require('./modules/content-quality.module');
const securityTechModule = require('./modules/security-tech.module');
const buildScores = require('./scoring.service');
const buildInsights = require('./insights.service');

module.exports = async function runAudit(payload) {
  const startedAt = Date.now();
  const domain = String(payload?.domain || '').trim();
  const businessName = payload?.businessName ? String(payload.businessName).trim() : null;
  const mode = payload?.mode === 'desktop' ? 'desktop' : 'mobile';
  const competitors = Array.isArray(payload?.competitors) ? payload.competitors : [];

  const moduleResults = await runModules({ domain, businessName, mode, competitors });
  const scores = buildScores(moduleResults);
  const competitorComparison = await compareCompetitors({ competitors, mode });
  const sectionWinners = buildSectionWinners(moduleResults, competitorComparison);
  const overallPosition = buildOverallPosition(scores, competitorComparison, domain);
  const techComparison = buildTechComparison(moduleResults, competitorComparison, domain);
  const competitorAnalyzerData = await buildCompetitorAnalyzerData({ domain, businessName, competitors });
  const insights = await buildInsights({
    domain,
    competitors: competitorComparison,
    modules: moduleResults,
    scores,
  });

  const issues = collectIssues(moduleResults);
  const recommendations = buildRecommendations(issues);
  const actionPlan = buildActionPlan(issues, recommendations);
  const proof = buildProofBlock({
    domain,
    modules: moduleResults,
    scores,
    sectionWinners,
    overallPosition,
  });

  return {
    status: 'completed',
    summary: {
      domain,
      generatedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      overallScore: scores.overallScore,
      keyIssuesCount: issues.length,
    },
    scores,
    modules: moduleResults,
    issues,
    recommendations,
    actionPlan,
    proof,
    competitiveGap: {
      competitors: competitorComparison,
      insights: insights.competitiveGapAnalysis || [],
    },
    comparison: {
      sectionWinners,
      overallPosition,
      techComparison,
    },
    competitorAnalyzerData,
    insights: {
      top5Issues: insights.topIssues || [],
      quickWins: insights.quickWins || [],
      source: insights.generatedBy || 'rules',
    },
    costMeta: {
      pagespeedCalls: 1 + competitors.length,
      mapsCalls: 1 + competitors.length,
      cacheHit: false,
    },
  };
};

async function runModules(input) {
  const [performance, localSeo, technicalSeo, trackingStack, contentQuality, securityTech] = await Promise.all([
    performanceModule(input),
    localSeoModule(input),
    technicalSeoModule(input),
    trackingStackModule(input),
    contentQualityModule(input),
    securityTechModule(input),
  ]);

  return {
    performance,
    localSeo,
    technicalSeo,
    trackingStack,
    contentQuality,
    securityTech,
  };
}

async function compareCompetitors({ competitors, mode }) {
  return Promise.all(
    competitors.map(async (domain) => {
      const [performance, localSeo, technicalSeo] = await Promise.all([
        performanceModule({ domain, mode, competitors: [] }),
        localSeoModule({ domain, businessName: domain, competitors: [] }),
        technicalSeoModule({ domain }),
      ]);
      const tracking = await trackingStackModule({ domain });
      const content = await contentQualityModule({ domain });
      const security = await securityTechModule({ domain });
      const scores = buildScores({
        performance,
        localSeo,
        technicalSeo,
        trackingStack: tracking,
        contentQuality: content,
        securityTech: security,
      });
      return {
        domain,
        overallScore: scores.overallScore,
        performance: performance.score,
        seo: scores.categories.seo,
        tracking: scores.categories.tracking,
        bestPracticesSecurity: scores.categories.bestPracticesSecurity,
        localSeo: {
          score: localSeo?.score ?? 0,
          rating: localSeo?.business?.rating ?? null,
          totalReviews: localSeo?.business?.totalReviews ?? null,
        },
        contentQuality: {
          missingAltTags: content?.missingAltTags ?? 0,
          internalLinksCount: content?.internalLinksCount ?? 0,
        },
        techStack: {
          framework: technicalSeo?.framework || null,
          cms: technicalSeo?.cms || null,
          server: technicalSeo?.server || null,
          cdn: technicalSeo?.cdn || null,
        },
        schemaTypes: technicalSeo?.structuredData?.schemaTypes || [],
      };
    })
  );
}

function collectIssues(modules) {
  const merged = [
    ...(modules?.performance?.issues || []),
    ...(modules?.technicalSeo?.issues || []),
    ...(modules?.trackingStack?.issues || []),
    ...(modules?.contentQuality?.issues || []),
    ...(modules?.securityTech?.issues || []),
  ];
  return merged.slice(0, 40);
}

function buildRecommendations(issues) {
  return issues.slice(0, 10).map((entry) => ({
    priority: entry.severity === 'critical' ? 'high' : 'medium',
    recommendation: entry.title,
    expectedImpact: entry.severity === 'critical' ? 'High' : 'Moderate',
  }));
}

function buildActionPlan(issues, recommendations) {
  return issues.slice(0, 8).map((issue, index) => ({
    step: index + 1,
    issue: issue.title,
    severity: issue.severity || 'warning',
    recommendation: recommendations[index]?.recommendation || issue.title,
    priority: recommendations[index]?.priority || (issue.severity === 'critical' ? 'high' : 'medium'),
    expectedImpact: recommendations[index]?.expectedImpact || (issue.severity === 'critical' ? 'High' : 'Moderate'),
  }));
}

function buildProofBlock({ domain, modules, scores, sectionWinners, overallPosition }) {
  return {
    domain,
    overallScore: scores?.overallScore || 0,
    overallRank: overallPosition?.rank || null,
    rankOutOf: overallPosition?.total || null,
    coreWebVitals: modules?.performance?.coreWebVitals || null,
    seoProof: {
      missingAltTags: modules?.contentQuality?.missingAltTags ?? 0,
      schemaTypes: modules?.technicalSeo?.structuredData?.schemaTypes || [],
      noindexDetected: !!modules?.technicalSeo?.indexability?.noindexDetected,
      canonicalIssue: !!modules?.technicalSeo?.indexability?.canonicalIssue,
    },
    localSeoProof: {
      rating: modules?.localSeo?.business?.rating ?? null,
      totalReviews: modules?.localSeo?.business?.totalReviews ?? null,
      insights: modules?.localSeo?.derivedInsights || [],
    },
    winnerProof: sectionWinners || [],
  };
}

function buildSectionWinners(yourModules, competitors) {
  const sections = [
    { key: 'performance', your: Number(yourModules?.performance?.score || 0) },
    { key: 'seo', your: Math.round((Number(yourModules?.technicalSeo?.score || 0) + Number(yourModules?.contentQuality?.score || 0)) / 2) },
    { key: 'tracking', your: Number(yourModules?.trackingStack?.score || 0) },
    { key: 'localSeo', your: Number(yourModules?.localSeo?.score || 0) },
    { key: 'bestPracticesSecurity', your: Math.round((Number(yourModules?.performance?.categories?.bestPractices || 0) + Number(yourModules?.securityTech?.score || 0)) / 2) },
  ];

  return sections.map((section) => {
    let winnerDomain = 'you';
    let winnerScore = section.your;
    competitors.forEach((entry) => {
      const score = Number(
        section.key === 'performance' ? entry.performance
          : section.key === 'seo' ? entry.seo
            : section.key === 'tracking' ? entry.tracking
            : section.key === 'localSeo' ? entry.localSeo?.score
                : entry.bestPracticesSecurity
      ) || 0;
      if (score > winnerScore) {
        winnerScore = score;
        winnerDomain = entry.domain;
      }
    });
    return { section: section.key, winner: winnerDomain, winnerScore, yourScore: section.your };
  });
}

function buildOverallPosition(yourScores, competitors, domain) {
  const leaderboard = [
    { domain, score: Number(yourScores?.overallScore || 0), type: 'you' },
    ...competitors.map((entry) => ({ domain: entry.domain, score: Number(entry.overallScore || 0), type: 'competitor' })),
  ].sort((a, b) => b.score - a.score);
  const rank = leaderboard.findIndex((entry) => entry.type === 'you') + 1;
  return {
    rank,
    total: leaderboard.length,
    leaderboard,
  };
}

function buildTechComparison(yourModules, competitors, domain) {
  const your = {
    domain,
    framework: yourModules?.technicalSeo?.framework || null,
    cms: yourModules?.technicalSeo?.cms || null,
    server: yourModules?.technicalSeo?.server || null,
    cdn: yourModules?.technicalSeo?.cdn || null,
  };
  return {
    your,
    competitors: competitors.map((entry) => ({
      domain: entry.domain,
      framework: entry?.techStack?.framework || null,
      cms: entry?.techStack?.cms || null,
      server: entry?.techStack?.server || null,
      cdn: entry?.techStack?.cdn || null,
    })),
  };
}

async function buildCompetitorAnalyzerData({ domain, businessName, competitors }) {
  const yourSite = await analyzeDomain(domain, businessName || null);
  const competitorsData = await Promise.all(competitors.map((entry) => analyzeDomain(entry, entry)));
  const all = [yourSite, ...competitorsData];
  return {
    summary: {
      status: all.some((entry) => entry.status === 'failed') ? 'partial' : 'completed',
      generatedAt: new Date().toISOString(),
      totalDomainsAnalyzed: all.length,
      completedDomains: all.filter((entry) => entry.status === 'completed').length,
      partialDomains: all.filter((entry) => entry.status === 'partial').length,
      failedDomains: all.filter((entry) => entry.status === 'failed').length,
      totalErrors: all.reduce((sum, entry) => sum + (entry.errors?.length || 0), 0),
    },
    yourSite,
    competitors: competitorsData,
  };
}

async function analyzeDomain(currentDomain, mapsBusinessName) {
  const startedAt = Date.now();
  const [ps, sc, tc, gm] = await Promise.allSettled([
    pageSpeed(currentDomain),
    scrape(currentDomain),
    technicalChecks(currentDomain),
    googleMaps({ domain: currentDomain, businessName: mapsBusinessName }),
  ]);
  const pageSpeedResult = settledResult(ps, 'PageSpeed task crashed');
  const scrapeResult = settledResult(sc, 'Scraping task crashed');
  const technicalResult = settledResult(tc, 'Technical checks task crashed');
  const mapsResult = settledResult(gm, 'Google Maps task crashed');

  const tasks = {
    pageSpeed: pageSpeedResult.status,
    scraping: scrapeResult.status,
    technicalChecks: technicalResult.status,
    googleMaps: mapsResult.status,
  };

  const errors = Object.entries(tasks)
    .filter(([, status]) => status !== 'completed')
    .map(([task]) => ({
      task,
      error: {
        pageSpeed: pageSpeedResult,
        scraping: scrapeResult,
        technicalChecks: technicalResult,
        googleMaps: mapsResult,
      }[task]?.error || 'Task failed',
    }));

  return {
    domain: currentDomain,
    status: errors.length ? 'partial' : 'completed',
    elapsedMs: Date.now() - startedAt,
    tasks,
    data: {
      pageSpeed: pageSpeedResult,
      scraping: scrapeResult,
      technicalChecks: technicalResult,
      googleMaps: mapsResult,
    },
    errors,
  };
}

function settledResult(settled, defaultError) {
  if (settled.status === 'fulfilled') return settled.value;
  return { status: 'failed', data: null, error: settled.reason?.message || defaultError };
}
