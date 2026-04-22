'use strict';

const { normalizeDomain } = require('./domain');

function normalizeAutomationHost(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch (_error) {
    return null;
  }

  const normalizedHost = normalizeDomain(parsed.hostname, { allowLocal: true });
  if (!normalizedHost) return null;

  const port = String(parsed.port || '').trim();
  if (!port) return normalizedHost;
  const portNum = Number(port);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) return null;
  return `${normalizedHost}:${portNum}`;
}

function buildAutomationStartUrl(hostWithOptionalPort) {
  const normalized = normalizeAutomationHost(hostWithOptionalPort);
  if (!normalized) return null;
  if (normalized === 'localhost' || normalized.startsWith('localhost:') || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(normalized)) {
    return `http://${normalized}`;
  }
  return `https://${normalized}`;
}

module.exports = {
  normalizeAutomationHost,
  buildAutomationStartUrl,
};
