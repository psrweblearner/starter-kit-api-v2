'use strict';

let GeminiClient = null;
try {
  ({ GoogleGenerativeAI: GeminiClient } = require('@google/generative-ai'));
} catch (_error) {
  GeminiClient = null;
}

module.exports = async function businessReport(req) {
  const payload = req.body || {};
  const fallback = buildFallback(payload);
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || !GeminiClient) return fallback;

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const client = new GeminiClient(apiKey);
    const model = client.getGenerativeModel({ model: modelName });
    const prompt = [
      'You are an SEO expert and business consultant.',
      'Convert structured website audit JSON into a SIMPLE and CLEAR report for a business owner.',
      'IMPORTANT: Do NOT explain technical things deeply. Focus on WHAT is wrong and WHAT to do. Use simple language.',
      'Return STRICT JSON only in this exact shape:',
      '{"summary":{"overallProblem":"","mainReason":"","businessImpact":""},"topIssues":[{"issue":"","problem":"","solution":""}],"quickFixes":[""],"competitorComparison":{"whyYouAreBehind":"","whatCompetitorsDoingBetter":""}}',
      'Rules:',
      '- Pick all major issues and give clear solutions',
      '- Focus on impact on traffic, speed, ranking',
      '- Do not return raw data',
      `InputAuditJson: ${JSON.stringify(payload.audit || {})}`,
    ].join('\n');
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || '';
    const parsed = safeParseJson(text);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return normalizeReport(parsed, fallback);
  } catch (_error) {
    return fallback;
  }
};

function safeParseJson(value) {
  try {
    const cleaned = String(value || '').replace(/^```json/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (_error) {
    return null;
  }
}

function normalizeReport(parsed, fallback) {
  return {
    summary: parsed.summary || fallback.summary,
    topIssues: Array.isArray(parsed.topIssues) ? parsed.topIssues : fallback.topIssues,
    quickFixes: Array.isArray(parsed.quickFixes) ? parsed.quickFixes : fallback.quickFixes,
    competitorComparison: parsed.competitorComparison || fallback.competitorComparison,
  };
}

function buildFallback(payload) {
  const issues = Array.isArray(payload?.audit?.issues) ? payload.audit.issues : [];
  const topIssues = issues.slice(0, 8).map((item) => ({
    issue: String(item?.title || 'Audit issue'),
    problem: String(item?.detail || 'This issue is reducing performance or SEO results.'),
    solution: `Fix "${String(item?.title || 'this issue')}" first on top business pages, then re-audit to confirm improvement.`,
  }));
  const quickFixes = topIssues.slice(0, 5).map((item) => item.solution);
  return {
    summary: {
      overallProblem: 'Your website has multiple performance and SEO gaps that are holding back rankings and leads.',
      mainReason: 'Key technical issues are reducing search visibility and user experience quality.',
      businessImpact: 'You may be losing traffic, leads, and ad efficiency compared to better-optimized competitors.',
    },
    topIssues: topIssues.length ? topIssues : [
      {
        issue: 'Performance and SEO quality are below potential',
        problem: 'Current setup is slowing growth and reducing discoverability.',
        solution: 'Prioritize speed optimization and technical SEO fixes on your highest-value pages.',
      },
    ],
    quickFixes: quickFixes.length ? quickFixes : [
      'Fix missing alt tags on key pages.',
      'Improve title/meta quality for core landing pages.',
      'Reduce heavy page assets to improve loading speed.',
    ],
    competitorComparison: {
      whyYouAreBehind: 'Competitors likely have cleaner technical SEO and better performance consistency.',
      whatCompetitorsDoingBetter: 'They are loading faster, signaling relevance better to search engines, and showing stronger local trust.',
    },
  };
}
