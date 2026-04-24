'use strict';

let GeminiClient = null;
try {
  ({ GoogleGenerativeAI: GeminiClient } = require('@google/generative-ai'));
} catch (_err) {
  GeminiClient = null;
}

module.exports = async function buildInsights({ domain, competitors, modules, scores }) {
  const ruleBased = buildRuleInsights({ domain, competitors, modules, scores });
  const ai = await enrichWithGemini({ domain, competitors, modules, scores, ruleBased });
  return ai || ruleBased;
};

function buildRuleInsights({ competitors = [], modules, scores }) {
  const topIssues = [
    ...(modules?.performance?.issues || []),
    ...(modules?.technicalSeo?.issues || []),
    ...(modules?.securityTech?.issues || []),
    ...(modules?.contentQuality?.issues || []),
  ]
    .slice(0, 12)
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 5);

  const quickWins = [];
  if (!modules?.technicalSeo?.basicSeo?.metaDescription) quickWins.push('Add a unique meta description for key pages.');
  if ((modules?.contentQuality?.missingAltTags || 0) > 0) quickWins.push('Fix missing alt tags for images on critical pages.');
  if ((modules?.performance?.opportunities || []).length > 0) quickWins.push('Prioritize top Lighthouse opportunities to reduce load time.');
  if ((modules?.localSeo?.business?.totalReviews || 0) < 20) quickWins.push('Run a review-acquisition campaign to improve local trust signals.');

  const competitiveGap = [];
  const competitorAvgReviews = average((competitors || []).map((item) => Number(item?.localSeo?.totalReviews || 0)).filter((v) => v > 0));
  const yourReviews = Number(modules?.localSeo?.business?.totalReviews || 0);
  if (competitorAvgReviews > 0 && yourReviews < competitorAvgReviews) {
    competitiveGap.push('Competitors have stronger review volume; improve local review acquisition.');
  }
  if ((modules?.technicalSeo?.structuredData?.schemaTypes || []).length === 0) {
    competitiveGap.push('Your site is missing schema markup signals that competitors commonly use.');
  }
  if (Number(scores?.categories?.performance || 0) < 70) {
    competitiveGap.push('Your performance score trails market expectations for fast-loading pages.');
  }

  return {
    topIssues,
    quickWins: quickWins.slice(0, 5),
    competitiveGapAnalysis: competitiveGap.slice(0, 5),
    generatedBy: 'rules',
  };
}

async function enrichWithGemini({ domain, scores, ruleBased }) {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || !GeminiClient) return null;
  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const client = new GeminiClient(apiKey);
    const model = client.getGenerativeModel({ model: modelName });
    const prompt = [
      'You are an SEO auditor. Rewrite concise actionable insights in JSON.',
      `Domain: ${domain}`,
      `Scores: ${JSON.stringify(scores)}`,
      `RuleBased: ${JSON.stringify(ruleBased)}`,
      'Return strictly JSON with keys: topIssues, quickWins, competitiveGapAnalysis.',
    ].join('\n');
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || '';
    const parsed = safeParseJson(text);
    if (!parsed) return null;
    return {
      topIssues: Array.isArray(parsed.topIssues) ? parsed.topIssues : ruleBased.topIssues,
      quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : ruleBased.quickWins,
      competitiveGapAnalysis: Array.isArray(parsed.competitiveGapAnalysis) ? parsed.competitiveGapAnalysis : ruleBased.competitiveGapAnalysis,
      generatedBy: 'gemini',
    };
  } catch (_error) {
    return null;
  }
}

function safeParseJson(value) {
  try {
    const cleaned = String(value || '').replace(/^```json/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (_error) {
    return null;
  }
}

function severityRank(severity) {
  if (severity === 'critical') return 0;
  if (severity === 'warning') return 1;
  return 2;
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
