'use strict';

const scrape = require('../../competitor/scrape.service');
const technicalChecks = require('../../competitor/sitemap.service');

module.exports = async function securityTechModule({ domain }) {
  const [scrapeData, checkData] = await Promise.all([scrape(domain), technicalChecks(domain)]);
  const headers = scrapeData?.raw?.headers || {};
  const finalUrl = String(scrapeData?.raw?.finalUrl || '');
  const isHttps = finalUrl.startsWith('https://');
  const hasMixedContent = /http:\/\//i.test(String(scrapeData?.raw?.html || ''));

  const headerChecks = [
    secHeader('Strict-Transport-Security', headers['strict-transport-security']),
    secHeader('X-Content-Type-Options', headers['x-content-type-options']),
    secHeader('Content-Security-Policy', headers['content-security-policy']),
  ];

  const issues = [];
  if (!isHttps || !checkData?.checks?.httpsEnabled) issues.push({ severity: 'critical', title: 'HTTPS is not fully enabled' });
  if (hasMixedContent) issues.push({ severity: 'warning', title: 'Possible mixed content references' });
  headerChecks.forEach((item) => {
    if (!item.present) issues.push({ severity: 'warning', title: `Missing security header: ${item.name}` });
  });

  return {
    status: scrapeData?.status === 'completed' ? 'completed' : 'partial',
    score: Math.max(0, 100 - issues.length * 18),
    https: isHttps,
    mixedContent: hasMixedContent,
    headers: headerChecks,
    bestPracticesSignal: scrapeData?.techStack || {},
    issues,
    error: scrapeData?.error || checkData?.error || null,
  };
};

function secHeader(name, value) {
  return {
    name,
    present: !!value,
    value: value || null,
  };
}
