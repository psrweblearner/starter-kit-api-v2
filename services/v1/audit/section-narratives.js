'use strict';

let GeminiClient = null;
try {
  ({ GoogleGenerativeAI: GeminiClient } = require('@google/generative-ai'));
} catch (_error) {
  GeminiClient = null;
}

module.exports = async function sectionNarratives(req) {
  const { domain, summary, scores, modules, competitiveGap, sections } = req.body || {};
  const requestedSections = Array.isArray(sections) && sections.length
    ? sections.map((entry) => String(entry || '').trim()).filter(Boolean)
    : ['Overview', 'Performance', 'SEO Audit', 'Tracking Stack', 'Content Analysis', 'Local SEO'];
  const fallback = buildFallback(domain, summary, scores, modules, competitiveGap, requestedSections);
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || !GeminiClient) return fallback;

  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const client = new GeminiClient(apiKey);
    const model = client.getGenerativeModel({ model: modelName });
    const prompt = [
      'You are a senior SEO consultant.',
      'Write one concise professional paragraph for each section listed below.',
      'Each paragraph must explain: current condition, weakness/gap, business impact, and what improvement direction is required.',
      'Use evidence from the provided report payload. No markdown.',
      `Sections: ${JSON.stringify(requestedSections)}`,
      `Domain: ${domain || '-'}`,
      `Summary: ${JSON.stringify(summary || {})}`,
      `Scores: ${JSON.stringify(scores || {})}`,
      `Modules: ${JSON.stringify(modules || {})}`,
      `CompetitiveGap: ${JSON.stringify(competitiveGap || {})}`,
      'Return strict JSON object with exactly these section keys.',
    ].join('\n');
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || '';
    const parsed = safeParseJson(text);
    if (!parsed) return fallback;
    return { ...fallback, ...parsed };
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

function buildFallback(domain, summary, scores, modules, competitiveGap, sections) {
  const templates = {
    Overview: `This report evaluates ${domain || 'the analyzed website'} with an overall score of ${summary?.overallScore ?? scores?.overallScore ?? '-'}. The current position indicates competitive gaps that require focused technical and content improvements.`,
    Performance: `Performance analysis shows Core Web Vitals with LCP ${modules?.performance?.coreWebVitals?.lcp || '-'}, CLS ${modules?.performance?.coreWebVitals?.cls || '-'}, and INP ${modules?.performance?.coreWebVitals?.inp || '-'}. Slower responsiveness versus competitors can reduce engagement and ranking efficiency.`,
    'SEO Audit': `SEO audit findings cover indexability, schema implementation, metadata quality, and crawl readiness, with a current SEO score of ${scores?.categories?.seo ?? '-'}. Missing technical SEO elements can suppress organic visibility and index coverage.`,
    'Tracking Stack': `Tracking validation identifies analytics and marketing stack completeness across Google, Meta, and session behavior tools. Gaps in tracking reduce attribution clarity and weaken data-driven campaign optimization.`,
    'Content Analysis': `Content analysis measures structure and quality signals including missing alt tags (${modules?.contentQuality?.missingAltTags ?? 0}), internal links, and keyword relevance. Weaknesses here reduce content authority and on-page competitiveness.`,
    'Local SEO': `Local SEO compares ratings, review volume, and engagement indicators against competitors and surfaces local visibility gaps: ${Array.isArray(competitiveGap?.insights) ? competitiveGap.insights.slice(0, 2).join('; ') : 'No major gap detected'}.`,
    'Position + Gap + Action Plan + Proof': `Position and gap analysis consolidates your ranking, competitive distance, and prioritized actions. This section clarifies what is underperforming and what evidence-backed improvements should be executed first.`,
    'Who Wins Each Section': `Section winner analysis benchmarks your performance against competitors across key categories. Losing sections indicate where competitor execution is stronger and where focused optimization is needed.`,
    'Overall Position vs Competitors': `Overall position benchmarks your site against all analyzed competitors. A lower rank indicates measurable strategic and technical deficiencies that should be addressed through prioritized action plans.`,
    'Tech Stack Comparison': `Tech stack comparison reviews framework, CMS, server, and CDN differences against competitors. Platform-level gaps can influence speed, SEO performance, and development agility.`,
    'Competitor Data (GMB, Errors, SEO)': `Competitor comparison highlights GMB authority, error concentration, and SEO strength across domains. This evidence identifies where competitors outperform and where targeted improvements can close the gap quickly.`,
  };

  return sections.reduce((acc, section) => {
    acc[section] = templates[section] || `This section provides an evidence-based assessment of ${section}, highlighting current performance, visible weaknesses, and recommended improvement direction.`;
    return acc;
  }, {});
}
