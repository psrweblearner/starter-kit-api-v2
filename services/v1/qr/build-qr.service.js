'use strict';

const fs = require('fs/promises');
const path = require('path');
const QRCode = require('qrcode');

module.exports = async function buildQr(payload) {
  const startedAt = Date.now();
  const content = String(payload.content || '').trim();
  const width = normalizeInteger(payload.width, 600, 120, 1200);
  const margin = normalizeInteger(payload.margin, 1, 0, 8);
  const darkColor = normalizeHexColor(payload.darkColor, '#000000');
  const lightColor = normalizeHexColor(payload.lightColor, '#ffffff');
  const fileName = sanitizeFileName(payload.fileName || 'qr-code');

  const folderName = `qr-${Date.now()}`;
  const outputDir = path.join(process.cwd(), 'public', 'qrs', folderName);
  await fs.mkdir(outputDir, { recursive: true });

  const fullFileName = `${fileName}.png`;
  const filePath = path.join(outputDir, fullFileName);

  await QRCode.toFile(filePath, content, {
    errorCorrectionLevel: 'H',
    type: 'png',
    quality: 1,
    margin,
    width,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });

  return {
    status: 'completed',
    content,
    width,
    margin,
    darkColor,
    lightColor,
    fileName: fullFileName,
    qrImageUrl: `/qrs/${folderName}/${fullFileName}`,
    qrFilePath: filePath,
    elapsedMs: Date.now() - startedAt,
  };
};

function normalizeInteger(rawValue, fallback, min, max) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function normalizeHexColor(rawValue, fallback) {
  const value = String(rawValue || '').trim();
  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value)) {
    return value;
  }
  return fallback;
}

function sanitizeFileName(input) {
  const value = String(input || 'qr-code').trim();
  const safe = value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return safe || 'qr-code';
}
