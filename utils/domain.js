'use strict';

function normalizeDomain(input, options = {}) {
  const {
    allowLocal = false,
  } = options;
  const value = String(input || '').trim();
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let hostname = '';

  try {
    const parsed = new URL(withProtocol);
    hostname = parsed.hostname.toLowerCase();
  } catch (_error) {
    return null;
  }

  if (!hostname) return null;
  if (hostname.startsWith('www.')) hostname = hostname.slice(4);
  if (!isValidHostname(hostname, { allowLocal })) return null;
  return hostname;
}

function isValidHostname(hostname, options = {}) {
  const { allowLocal = false } = options;
  if (!hostname || hostname.length > 253) return false;

  if (allowLocal && hostname === 'localhost') return true;
  if (allowLocal && isValidIpv4(hostname)) return true;
  if (!hostname.includes('.')) return false;

  const labels = hostname.split('.');
  if (labels.some((part) => !part || part.length > 63)) return false;

  for (const label of labels) {
    if (!/^[a-z0-9-]+$/i.test(label)) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
  }

  const tld = labels[labels.length - 1];
  return /^[a-z]{2,63}$/i.test(tld);
}

function isValidIpv4(value) {
  const parts = String(value || '').split('.');
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return false;
  }
  return true;
}

module.exports = {
  normalizeDomain,
};
