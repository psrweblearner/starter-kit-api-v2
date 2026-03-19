/**
 * ===================================================
 * uniqueId Function
 * ===================================================
 *
 * Generates a random alphanumeric unique identifier string with a default prefix "SK-".
 *
 * Parameters:
 * - length (number): The length of the random portion of the identifier. Default is 6.
 *
 * Returns:
 * - A string in the format "SK-XXXXXX" where X are random alphanumeric characters.
 *
 * Example:
 *   uniqueId(8) -> "SK-A1b2C3d4"
 */
const uniqueId = (length = 6) => {
  let result = '';
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "SK-" + result;
};

/**
 * ===================================================
 * Slugify Function
 * ===================================================
 *
 * Converts a string (usually a title) into a URL-friendly slug.
 * 
 * Functionality:
 * - Converts all characters to lowercase.
 * - Removes special characters and punctuation.
 * - Replaces spaces with hyphens.
 * - Collapses multiple consecutive hyphens into one.
 *
 * Returns:
 * - A clean, URL-friendly string suitable for slugs or identifiers.
 *
 * Example:
 *   slugify("Hello World! 2025") -> "hello-world-2025"
 */
const slugify = (title) => {
  let slug = title.toLowerCase();
  slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi, '');
  slug = slug.replace(/ /gi, "-");
  slug = slug.replace(/\-\-+/g, '-');
  return slug;
};

const generateFingerprint = (req) => {
  const crypto = require('crypto');
  const userAgent = req.headers['user-agent'] || 'STABLE_ADMIN_FINGERPRINT';
  return crypto.createHash('sha256').update(userAgent).digest('hex');
};

/**
 * ===================================================
 * normalizeStoragePath Function
 * ===================================================
 * Extracts the storage-relative path (key) from a full database path or cloud URL.
 */
const normalizeStoragePath = (filePath) => {
  if (!filePath) return '';
  let normalized = filePath;

  if (normalized.includes('storage.googleapis.com')) {
    // GCP: https://storage.googleapis.com/bucket-name/path/to/file
    normalized = normalized.split('/').slice(4).join('/');
  } else if (normalized.includes('amazonaws.com')) {
    // AWS: https://bucket-name.s3.region.amazonaws.com/path/to/file
    normalized = normalized.split('/').slice(3).join('/');
  } else {
    // Local: /uploads/path/to/file or uploads/path/to/file
    normalized = normalized.replace(/^\/?uploads\//, '');
  }
  return normalized;
};

module.exports = { slugify, uniqueId, generateFingerprint, normalizeStoragePath };