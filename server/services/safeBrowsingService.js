/**
 * Google Safe Browsing API v4 client.
 * Queries Google's threat database for known malware, phishing, and unwanted software URLs.
 */

export async function checkSafeBrowsingUrl(url, apiKey) {
  if (!apiKey || apiKey === 'replace_with_your_safe_browsing_key' || apiKey.trim() === '') {
    return {
      configured: false,
      status: 'unconfigured',
      summary: 'Google Safe Browsing API key not configured. Performing heuristic domain analysis only.',
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey.trim())}`;

  const requestBody = {
    client: {
      clientId: 'cyberguard-assistant',
      clientVersion: '1.0.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return {
        configured: true,
        status: 'error',
        statusCode: res.status,
        summary: `Safe Browsing provider returned status ${res.status}.`,
        details: errText,
      };
    }

    const data = await res.json();
    const matches = data.matches || [];

    if (matches.length > 0) {
      const threatTypes = matches.map((m) => m.threatType);
      return {
        configured: true,
        status: 'threat_detected',
        match: true,
        threatTypes,
        summary: `Threat confirmed by Google Safe Browsing: ${threatTypes.join(', ')}`,
      };
    }

    return {
      configured: true,
      status: 'no_threat_found',
      match: false,
      summary: 'No threat found in Google Safe Browsing database. (Note: Clean reputation does not guarantee safety).',
    };
  } catch (err) {
    return {
      configured: true,
      status: 'provider_unavailable',
      summary: `Safe Browsing service lookup failed: ${err.message}`,
    };
  }
}
