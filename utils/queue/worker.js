'use strict';
require('dotenv').config({ override: process.env.NODE_ENV !== 'production' });

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const pageSpeed = require('../../services/v1/competitor/pageSpeed.service');
const sitemap = require('../../services/v1/competitor/sitemap.service');
const scrape = require('../../services/v1/competitor/scrape.service');
const store  = require('../../temp/report.store');
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

new Worker(
  'analyze-queue',
  async (job) => {
    const { domain, competitors } = job.data;

    console.log('Processing job:', job.id);

    const analyzeOne = async (d) => {
      const [ps, sc, sm] = await Promise.allSettled([
        pageSpeed(d),
        scrape(d),
        sitemap(d),
      ]);

      return {
        domain: d,
        pageSpeed: ps.value || null,
        scrape: sc.value || null,
        sitemap: sm.value || null
      };
    };

    // YOUR SITE
    const yourSite = await analyzeOne(domain);

    // COMPETITORS
    const competitorResults = [];
    for (const comp of competitors) {
      const res = await analyzeOne(comp);
      competitorResults.push(res);
    }

    const finalResult = {
      yourSite,
      competitors: competitorResults
    };

    // save
    await store.save(job.id, finalResult);
    return finalResult;
  },
  { connection }
);