/**
 * Safe URL validation and extraction utilities.
 * Protects against SSRF, internal IP scanning, and non-web schemes.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
]);

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^fc00:/,
  /^fe80:/,
];

export function isValidWebUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, reason: 'Only HTTP and HTTPS URLs are supported' };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return { valid: false, reason: 'Internal or reserved hostnames cannot be analyzed' };
    }

    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, reason: 'Private network addresses cannot be analyzed' };
      }
    }

    return { valid: true, url: parsed.href, hostname: parsed.hostname };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Extracts URLs and domain links from plain text messages.
 * Detects http://, https://, www., and common naked domain/path patterns.
 */
export function extractUrlsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  // Match URLs starting with http://, https://, www., or naked domains with popular TLDs and optional paths
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'()]+|\b(?:[a-zA-Z0-9-]+\.)+(?:com|in|co|org|net|xyz|top|loan|click|info|biz|io|security|verify|live|online|site|app|cc|tech|club)\b(?:\/[^\s<>"'()]*)?/gi;

  const matches = text.match(urlRegex) || [];
  const validUrls = [];

  for (let match of matches) {
    // Strip trailing punctuation like . , ; : ! ? ) ]
    let cleaned = match.trim().replace(/[.,;:!?)\],]+$/, '');
    if (!cleaned) continue;

    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }

    const check = isValidWebUrl(cleaned);
    if (check.valid && !validUrls.includes(check.url)) {
      validUrls.push(check.url);
    }
  }

  return validUrls;
}
