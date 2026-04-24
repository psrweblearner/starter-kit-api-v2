'use strict';

const scrape = require('../../competitor/scrape.service');
const technicalChecks = require('../../competitor/sitemap.service');

module.exports = async function technicalSeoModule({ domain }) {
  const [scrapeData, checkData] = await Promise.all([scrape(domain), technicalChecks(domain)]);
  const extracted = scrapeData?.extracted || {};
  const schemaTypes = extractSchemaTypes(extracted.schemaMarkup || []);

  const issues = [];
  if (!extracted.title) issues.push(issue('critical', 'Missing title tag'));
  if (!extracted.metaDescription) issues.push(issue('warning', 'Missing meta description'));
  if (!extracted.canonicalUrl) issues.push(issue('warning', 'Missing canonical URL'));
  if ((extracted.headingCounts?.h1 || 0) !== 1) issues.push(issue('warning', 'H1 structure should have exactly one H1'));
  if (String(extracted.metaRobots || '').toLowerCase().includes('noindex')) issues.push(issue('critical', 'noindex detected'));
  if (!checkData?.checks?.sitemap?.exists) issues.push(issue('warning', 'sitemap.xml not found'));
  if (!checkData?.checks?.robotsTxt?.exists) issues.push(issue('warning', 'robots.txt not found'));

  return {
    status: scrapeData?.status === 'completed' ? 'completed' : 'partial',
    score: computeSeoTechnicalScore(issues.length),
    basicSeo: {
      title: extracted.title || null,
      metaDescription: extracted.metaDescription || null,
      canonical: extracted.canonicalUrl || null,
      robotsMeta: extracted.metaRobots || null,
      sitemapExists: !!checkData?.checks?.sitemap?.exists,
      robotsTxtExists: !!checkData?.checks?.robotsTxt?.exists,
    },
    socialTags: {
      openGraph: extracted.openGraph || {},
      twitter: extracted.twitter || {},
    },
    structuredData: {
      schemaTypes,
      totalScripts: Array.isArray(extracted.schemaMarkup) ? extracted.schemaMarkup.length : 0,
    },
    framework: scrapeData?.techStack?.framework || null,
    cms: scrapeData?.techStack?.cms || null,
    server: scrapeData?.techStack?.server || null,
    cdn: scrapeData?.techStack?.cdn || null,
    headings: extracted.headingCounts || {},
    indexability: {
      noindexDetected: String(extracted.metaRobots || '').toLowerCase().includes('noindex'),
      canonicalIssue: !extracted.canonicalUrl,
    },
    brokenLinks: checkData?.checks?.brokenLinks || { checked: 0, brokenCount: 0, broken: [] },
    issues,
    error: scrapeData?.error || checkData?.error || null,
  };
};

function issue(severity, title) {
  return { severity, title };
}

function extractSchemaTypes(schemaMarkup) {
  const values = new Set();
  schemaMarkup.forEach((entry) => {
    if (entry && typeof entry === 'object') {
      const type = entry['@type'];
      if (Array.isArray(type)) type.forEach((val) => values.add(String(val)));
      else if (type) values.add(String(type));
    }
  });
  return [...values];
}

function computeSeoTechnicalScore(issueCount) {
  return Math.max(0, 100 - issueCount * 12);
}
