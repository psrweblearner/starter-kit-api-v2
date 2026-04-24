'use strict';

const googleMaps = require('../../competitor/googlemaps.service');

module.exports = async function localSeoModule({ domain, businessName, competitors = [] }) {
  const yourData = await googleMaps({ domain, businessName });
  const competitorData = await Promise.all(
    competitors.map(async (entry) => {
      const data = await googleMaps({ domain: entry, businessName: entry });
      return { domain: entry, data };
    })
  );

  const competitorReviewCounts = competitorData
    .map((item) => Number(item?.data?.data?.totalReviews || 0))
    .filter((value) => value > 0);
  const competitorAvgReviews = competitorReviewCounts.length
    ? Math.round(competitorReviewCounts.reduce((sum, value) => sum + value, 0) / competitorReviewCounts.length)
    : 0;
  const yourReviews = Number(yourData?.data?.totalReviews || 0);
  const yourRating = Number(yourData?.data?.rating || 0);

  const insights = [];
  if (competitorAvgReviews > 0 && yourReviews < competitorAvgReviews) {
    insights.push('Low review count vs competitors');
  }
  if (yourRating >= 4.5 && yourReviews > 0 && yourReviews < 20) {
    insights.push('High rating but low engagement');
  }

  return {
    status: yourData?.status === 'completed' ? 'completed' : 'partial',
    score: buildLocalSeoScore({ yourReviews, competitorAvgReviews, yourRating }),
    business: {
      name: yourData?.data?.businessName || businessName || domain,
      rating: yourData?.data?.rating ?? null,
      totalReviews: yourData?.data?.totalReviews ?? null,
      location: yourData?.raw?.placeDetails?.result?.formatted_address || null,
      placeId: yourData?.data?.placeId || null,
    },
    competitors: competitorData.map((item) => ({
      domain: item.domain,
      rating: item?.data?.data?.rating ?? null,
      totalReviews: item?.data?.data?.totalReviews ?? null,
    })),
    derivedInsights: insights,
    error: yourData?.error || null,
  };
};

function buildLocalSeoScore({ yourReviews, competitorAvgReviews, yourRating }) {
  let score = 0;
  if (yourRating > 0) score += Math.min(50, Math.round((yourRating / 5) * 50));
  if (competitorAvgReviews <= 0) score += yourReviews > 0 ? 50 : 20;
  else score += Math.min(50, Math.round((yourReviews / competitorAvgReviews) * 50));
  return Math.max(0, Math.min(100, score));
}
