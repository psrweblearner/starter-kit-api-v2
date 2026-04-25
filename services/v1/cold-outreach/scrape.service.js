'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns').promises;
const { normalizeWebsite } = require('./shared');

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;

async function respectsRobots(baseUrl, path) {
  try {
    const robotsUrl = `${baseUrl.replace(/\/+$/, '')}/robots.txt`;
    const res = await axios.get(robotsUrl, { timeout: 7000 });
    const content = String(res.data || '');
    const lines = content.split(/\r?\n/).map((line) => line.trim());
    let userAgentAll = false;
    const disallows = [];
    lines.forEach((line) => {
      if (!line || line.startsWith('#')) return;
      const [k, ...rest] = line.split(':');
      const key = String(k || '').trim().toLowerCase();
      const val = rest.join(':').trim();
      if (key === 'user-agent') userAgentAll = val === '*';
      if (key === 'disallow' && userAgentAll) disallows.push(val);
    });
    return !disallows.some((rule) => rule && path.startsWith(rule));
  } catch (_error) {
    return true;
  }
}

async function extractFromUrl(url) {
  const response = await axios.get(url, { timeout: 10000, maxRedirects: 4 });
  const html = String(response.data || '');
  const $ = cheerio.load(html);
  const footerText = $('footer').text() || '';
  const text = `${$.text()} ${footerText}`;
  const emails = [...new Set((text.match(EMAIL_REGEX) || []).map((e) => e.toLowerCase()))];
  const phones = [...new Set((text.match(PHONE_REGEX) || []).map((p) => p.trim()))];
  return { emails, phones };
}

async function validateMx(email) {
  const domain = String(email || '').split('@')[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (_error) {
    return false;
  }
}

async function scrapeLeadContacts(website) {
  const home = normalizeWebsite(website);
  if (!home) return { emails: [], phones: [], sources: [] };
  const base = new URL(home).origin;
  const targets = ['/', '/contact', '/about'];
  const collectedEmails = new Set();
  const collectedPhones = new Set();
  const sources = [];

  // Optional Playwright usage; fallback to axios/cheerio if unavailable
  let browser = null;
  try {
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
  } catch (_error) {}

  try {
    for (const path of targets) {
      const allowed = await respectsRobots(base, path);
      if (!allowed) continue;
      const targetUrl = `${base}${path}`;
      let data;
      if (browser) {
        const page = await browser.newPage();
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        const text = await page.textContent('body');
        const emails = [...new Set((String(text || '').match(EMAIL_REGEX) || []).map((e) => e.toLowerCase()))];
        const phones = [...new Set((String(text || '').match(PHONE_REGEX) || []).map((p) => p.trim()))];
        await page.close();
        data = { emails, phones };
      } else {
        data = await extractFromUrl(targetUrl);
      }
      data.emails.forEach((email) => collectedEmails.add(email));
      data.phones.forEach((phone) => collectedPhones.add(phone));
      sources.push(targetUrl);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  const emailRows = await Promise.all(
    [...collectedEmails].map(async (email) => ({
      email,
      isValidMx: await validateMx(email),
    }))
  );

  return {
    emails: emailRows,
    phones: [...collectedPhones],
    sources,
  };
}

module.exports = {
  scrapeLeadContacts,
};
