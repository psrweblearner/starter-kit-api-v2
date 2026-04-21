'use strict';
require('dotenv').config({ override: process.env.NODE_ENV !== 'production' });

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const pageSpeed = require('../../services/v1/competitor/pagespeed.service');
const scrape = require('../../services/v1/competitor/scrape.service');
const technicalChecks = require('../../services/v1/competitor/sitemap.service');
const googleMaps = require('../../services/v1/competitor/googlemaps.service');
const store = require('../../temp/report.store');
const { publishJobEvent } = require('./job-notification');
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

new Worker(
  'analyze-queue',
  async (job) => {
    try {
      const { domain, competitors, businessName } = job.data;

      console.log('Processing job:', job.id);

      const analyzeDomain = async (currentDomain, mapsBusinessName = null) => {
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

        const taskStatuses = {
          pageSpeed: pageSpeedResult.status,
          scraping: scrapeResult.status,
          technicalChecks: technicalResult.status,
          googleMaps: mapsResult.status,
        };
        const failedTasks = Object.entries(taskStatuses)
          .filter(([, status]) => status === 'failed')
          .map(([name]) => name);

        return {
          domain: currentDomain,
          status: failedTasks.length ? 'partial' : 'completed',
          elapsedMs: Date.now() - startedAt,
          tasks: taskStatuses,
          data: {
            pageSpeed: pageSpeedResult,
            scraping: scrapeResult,
            technicalChecks: technicalResult,
            googleMaps: mapsResult,
          },
          errors: failedTasks.map((taskName) => {
            const source = {
              pageSpeed: pageSpeedResult,
              scraping: scrapeResult,
              technicalChecks: technicalResult,
              googleMaps: mapsResult,
            }[taskName];
            return { task: taskName, error: source.error || 'Task failed' };
          }),
        };
      };

      const yourSite = await analyzeDomain(domain, businessName || null);
      const competitorSettled = await Promise.allSettled(
        competitors.map((comp) => analyzeDomain(comp, comp))
      );
      const competitorResults = competitorSettled.map((entry, index) => {
        if (entry.status === 'fulfilled') return entry.value;
        return {
          domain: competitors[index],
          status: 'failed',
          elapsedMs: 0,
          tasks: {
            pageSpeed: 'failed',
            scraping: 'failed',
            technicalChecks: 'failed',
            googleMaps: 'failed',
          },
          data: {
            pageSpeed: null,
            scraping: null,
            technicalChecks: null,
            googleMaps: null,
          },
          errors: [{ task: 'domain-analysis', error: entry.reason?.message || 'Domain task crashed' }],
        };
      });

      const allSites = [yourSite, ...competitorResults];
      const completedCount = allSites.filter((site) => site.status === 'completed').length;
      const partialCount = allSites.filter((site) => site.status === 'partial').length;
      const failedCount = allSites.filter((site) => site.status === 'failed').length;
      const totalErrors = allSites.reduce((sum, site) => sum + (site.errors?.length || 0), 0);

      const finalResult = {
        summary: {
          jobId: String(job.id),
          status: failedCount > 0 ? 'partial' : 'completed',
          generatedAt: new Date().toISOString(),
          totalDomainsAnalyzed: allSites.length,
          completedDomains: completedCount,
          partialDomains: partialCount,
          failedDomains: failedCount,
          totalErrors,
        },
        yourSite,
        competitors: competitorResults
      };

      await store.save(job.id, finalResult);
      await publishJobEvent({
        jobId: job.id,
        status: 'completed',
        summary: finalResult.summary,
      });
      return finalResult;
    } catch (error) {
      await publishJobEvent({
        jobId: job.id,
        status: 'failed',
        error: error?.message || 'Job failed',
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

function settledResult(settled, defaultError) {
  if (settled.status === 'fulfilled') {
    const value = settled.value;
    if (value && typeof value === 'object' && value.status) {
      return value;
    }
    return {
      status: 'completed',
      data: value,
      error: null,
      raw: value,
    };
  }

  return {
    status: 'failed',
    error: settled.reason?.message || defaultError,
    data: null,
    raw: null,
  };
}