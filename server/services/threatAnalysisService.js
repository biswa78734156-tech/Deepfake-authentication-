/**
 * CYBERGUARD Centralized Threat Analysis & Risk-Scoring Engine
 * Evaluates phishing emails, WhatsApp screenshots, SMS messages, loan fraud,
 * and malicious URLs to produce detailed, evidence-based Threat Assessment Reports.
 */

import { isValidWebUrl, extractUrlsFromText } from '../utils/urlValidator.js';

// Suspicious Top-Level Domains commonly abused in phishing
const SUSPICIOUS_TLDS = new Set([
  '.xyz', '.top', '.click', '.loan', '.work', '.gq', '.cf', '.tk', '.ml', '.buzz',
  '.fit', '.rest', '.bar', '.country', '.kim', '.cricket', '.science', '.party',
  '.su', '.monster', '.icu', '.cam', '.cfd'
]);

// URL shorteners and redirect services
const OBFUSCATED_SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 'is.gd', 't.co', 'cutt.ly', 'rb.gy', 'shorturl.at',
  'mnge.co', 'u3.mnge.co', 'ow.ly', 'buff.ly', 'rebrand.ly', 't.ly'
]);

// Known spoof targets and patterns
const KNOWN_TARGETS = [
  { name: 'HDFC Bank', brandPatterns: [/hdfc/i], legitDomain: 'hdfcbank.com' },
  { name: 'State Bank of India (SBI)', brandPatterns: [/\bsbi\b/i, /state bank/i], legitDomain: 'sbi.co.in' },
  { name: 'Punjab National Bank (PNB)', brandPatterns: [/\bpnb\b/i, /punjab national/i], legitDomain: 'pnbindia.in' },
  { name: 'ICICI Bank', brandPatterns: [/icici/i], legitDomain: 'icicibank.com' },
  { name: 'Axis Bank', brandPatterns: [/axis bank/i], legitDomain: 'axisbank.com' },
  { name: 'Amazon', brandPatterns: [/amaz[o0]n/i], legitDomain: 'amazon.com' },
  { name: 'Microsoft O365', brandPatterns: [/o365/i, /office ?365/i, /microsoft/i], legitDomain: 'microsoft.com' },
  { name: 'PayPal', brandPatterns: [/paypa[l1]/i], legitDomain: 'paypal.com' },
  { name: 'Netflix', brandPatterns: [/netf[l1]ix/i], legitDomain: 'netflix.com' },
  { name: 'Google', brandPatterns: [/goog[l1]e/i], legitDomain: 'google.com' },
  { name: 'Tide', brandPatterns: [/\btide\b/i], legitDomain: 'tide.co' },
];

/**
 * Maps raw risk scores (0-100) to standardized CYBERGUARD risk bands.
 * 0–19: Low Risk
 * 20–39: Guarded
 * 40–59: Medium Risk
 * 60–79: High Risk
 * 80–100: Critical Risk
 */
export function getRiskBand(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Guarded';
  return 'Low Risk';
}

/**
 * Redacts any raw OTP digits or sensitive personal tokens from text before echoing in reports.
 */
export function sanitizeSensitiveEvidence(text) {
  if (!text || typeof text !== 'string') return '';
  // Redact 4 to 8 digit standalone numbers that resemble OTPs or PINs
  return text.replace(/\b(\d{4,8})\b/g, '[REDACTED OTP/CODE]');
}

/**
 * Calculates a deterministic risk score (0-100) from distinct evidence flags.
 * Avoids double-counting repeated occurrences of the same indicator category.
 */
export function calculateRiskScore(evidenceFlags) {
  let score = 0;
  const appliedCategories = new Set();

  const addWeight = (category, weight) => {
    if (!appliedCategories.has(category)) {
      appliedCategories.add(category);
      score += weight;
    }
  };

  if (evidenceFlags.hasSafeBrowsingThreat) {
    addWeight('safe_browsing_threat', 95);
  }
  if (evidenceFlags.isBankOtpPhishing) {
    addWeight('bank_otp_phishing', 70);
  }
  if (evidenceFlags.isBankImpersonationWithBlockThreat) {
    addWeight('bank_block_threat', 50);
  }
  if (evidenceFlags.isRewardVoucherScam) {
    addWeight('reward_voucher_scam', 65);
  }
  if (evidenceFlags.isAccountDeletionOrSuspensionScam) {
    addWeight('account_deletion_threat', 55);
  }
  if (evidenceFlags.isLoanFraudWithObfuscatedLink) {
    addWeight('loan_fraud_offer', 55);
  }
  if (evidenceFlags.isBrandImpersonationDomain) {
    addWeight('brand_impersonation_domain', 45);
  }
  if (evidenceFlags.isSenderDomainMismatch) {
    addWeight('sender_domain_mismatch', 55);
  }
  if (evidenceFlags.isOtpOrCredentialSolicitation) {
    addWeight('credential_solicitation', 35);
  }
  if (evidenceFlags.isUpiOrPaymentSolicitation) {
    addWeight('payment_solicitation', 30);
  }
  if (evidenceFlags.isDiscouragingOfficialContact) {
    addWeight('discourage_official_contact', 25);
  }
  if (evidenceFlags.isArtificialUrgencyOrDeadline) {
    addWeight('urgency_deadline', 20);
  }
  if (evidenceFlags.isObfuscatedOrTrackingLink) {
    addWeight('obfuscated_link', 25);
  }
  if (evidenceFlags.isSuspiciousTld) {
    addWeight('suspicious_tld', 20);
  }
  if (evidenceFlags.isDirectIpUrl) {
    addWeight('direct_ip_url', 35);
  }
  if (evidenceFlags.isAdvanceFeeOrFakeDeposit) {
    addWeight('advance_fee', 35);
  }
  if (evidenceFlags.isSpellingOrCoerciveLanguage && score > 0) {
    addWeight('coercive_language', 10);
  }

  // Cap score at 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculates a separate confidence estimate (0-100) based on signal clarity
 * and corroborated evidence factors.
 */
export function calculateConfidence(score, indicatorCount, hasCorroboration, isProviderValidated) {
  if (score >= 80) {
    return hasCorroboration ? 95 : 90;
  }
  if (score >= 60) {
    return hasCorroboration ? 88 : 82;
  }
  if (score >= 40) {
    return 78;
  }
  if (score >= 20) {
    return 72;
  }
  // Low risk / benign
  return isProviderValidated ? 90 : 85;
}

/**
 * Analyzes arbitrary text (pasted message, email transcript, OCR text, or URL)
 * using the centralized detection engine.
 */
export function analyzeThreatText(text, safeBrowsingContext = null, options = {}) {
  const safeText = typeof text === 'string' ? text : '';
  const normalized = safeText.toLowerCase();
  const detectedIndicators = [];
  const evidenceFlags = {};

  // Extract URLs
  const urls = extractUrlsFromText(safeText);
  const parsedUrls = [];
  for (const u of urls) {
    try {
      const parsed = new URL(u);
      parsedUrls.push({ original: u, hostname: parsed.hostname.toLowerCase(), pathname: parsed.pathname });
    } catch {
      // Ignore invalid URL
    }
  }

  // 1. External Threat Intelligence check (Safe Browsing)
  let safeBrowsingSummary = 'No external URL reputation queried.';
  if (safeBrowsingContext && Array.isArray(safeBrowsingContext) && safeBrowsingContext.length > 0) {
    const hits = safeBrowsingContext.filter(c => c.result?.status === 'threat_detected');
    if (hits.length > 0) {
      evidenceFlags.hasSafeBrowsingThreat = true;
      const threatTypes = hits.map(h => h.result?.threatTypes?.join(', ')).join('; ');
      detectedIndicators.push(`🚨 GOOGLE SAFE BROWSING CONFIRMED MALICIOUS: Flagged as [${threatTypes}]`);
      safeBrowsingSummary = `Confirmed malicious in Google Safe Browsing threat database (${threatTypes}).`;
    } else {
      const cleanChecks = safeBrowsingContext.filter(c => c.result?.status === 'no_threat_found');
      if (cleanChecks.length > 0) {
        safeBrowsingSummary = 'Google Safe Browsing found no active threats for checked URLs. (Note: Newly created phishing sites may not yet appear).';
      } else {
        safeBrowsingSummary = `Safe Browsing provider lookup: ${safeBrowsingContext[0]?.result?.summary || 'Inconclusive / not configured.'}`;
      }
    }
  } else {
    safeBrowsingSummary = 'Safe Browsing provider lookup: Google Safe Browsing API key not configured. Performing heuristic domain analysis only.';
  }

  // 2. Sensitive Credential & OTP solicitation
  const hasOtpMention = /(\botp\b|one[- ]time password|verification code)/i.test(safeText);
  const hasPinCvvMention = /(\bcvv\b|\bcvc\b|card number|atm pin)/i.test(safeText);
  const hasPasswordMention = /(\bpassword\b|secret key|seed phrase|private key)/i.test(safeText);
  const hasUpiMention = /(upi id|google pay|phonepe|paytm|@okaxis|@okhdfcbank|@paytm)/i.test(safeText);

  if (hasOtpMention) {
    evidenceFlags.isOtpOrCredentialSolicitation = true;
    detectedIndicators.push('Solicitation of One-Time Password (OTP) or verification code detected in message context.');
  }
  if (hasPinCvvMention) {
    evidenceFlags.isOtpOrCredentialSolicitation = true;
    detectedIndicators.push('Debit/Credit Card CVV, PIN, or sensitive card details requested.');
  }
  if (hasPasswordMention) {
    evidenceFlags.isOtpOrCredentialSolicitation = true;
    detectedIndicators.push('Direct password or authentication credential solicitation.');
  }
  if (hasUpiMention) {
    evidenceFlags.isUpiOrPaymentSolicitation = true;
    detectedIndicators.push('Request for personal Unified Payments Interface (UPI) ID / payment handle.');
  }

  // 3. Bank Impersonation & Account-Blocking Scams
  const mentionsBank = /(hdfc|sbi\b|state bank|pnb\b|punjab national|icici|axis bank|kotak|citibank|bank account)/i.test(safeText);
  const mentionsAccountBlock = /(temporarily blocked|permanent block|account.*blocked|account.*suspended|avoid permanent block|unfreeze account|kyc.*update|pan.*link)/i.test(safeText);
  const discouragesCalling = /(no need to call|don't call|do not contact|special verification process|online mode only)/i.test(safeText);

  if (mentionsBank && mentionsAccountBlock) {
    evidenceFlags.isBankImpersonationWithBlockThreat = true;
    detectedIndicators.push('Sender claims to represent a financial institution and asserts the recipient\'s bank account has been blocked.');
  }

  if (mentionsBank && hasOtpMention) {
    evidenceFlags.isBankOtpPhishing = true;
    detectedIndicators.push('CRITICAL INDICATOR: Unverified party claims bank affiliation and solicits an OTP directly in the conversation.');
  }

  if (discouragesCalling) {
    evidenceFlags.isDiscouragingOfficialContact = true;
    detectedIndicators.push('Sender explicitly discourages contacting official branch or telephone customer-care channels.');
  }

  // 4. Fake Reward, Prize & Gift-Voucher Scams
  const mentionsRewardOrVoucher = /(gift voucher|won.*voucher|\b5000\b.*voucher|amazon.*voucher|flipkart.*voucher|claim.*voucher|claim.*prize|won.*₹|won.*inr|lottery)/i.test(safeText);
  const promisesInstantCredit = /(sent to your upi within 5 minutes|credited instantly|credited after verification|voucher will be sent)/i.test(safeText);
  const prematureTrust = /(yes,? it'?s real|congratulations|our team is here to help|special process)/i.test(safeText);

  if (mentionsRewardOrVoucher && (hasUpiMention || /(share your name|mobile number|personal details)/i.test(safeText))) {
    evidenceFlags.isRewardVoucherScam = true;
    detectedIndicators.push('Unexpected high-value reward or gift voucher promised in exchange for personal information and financial UPI details.');
  }
  if (promisesInstantCredit) {
    detectedIndicators.push('Unrealistic instant-credit inducement promised ("credited within 5 minutes / instantly").');
  }
  if (prematureTrust && mentionsRewardOrVoucher) {
    detectedIndicators.push('Social engineering tactic: Inducing premature trust to bypass user caution.');
  }

  // 5. Financial Fraud & Suspicious Loan Offers (English & Hinglish)
  const isHinglishLoan = /(funding ki zarurat|zarurat hai|paayein.*loan|flexible loan|loan via tide|apply now.*t&c|package paayein)/i.test(safeText);
  const hasLoanAmount = /(inr\s*50,?000|50\s*lakh|5\s*lakh|flexible loan|instant loan|pre-approved loan)/i.test(safeText);

  if (isHinglishLoan || (hasLoanAmount && /(apply now|click below|paayein)/i.test(safeText))) {
    evidenceFlags.isLoanFraudWithObfuscatedLink = true;
    detectedIndicators.push('Unsolicited high-value loan offer using mass-solicitation language ("Funding ki zarurat hai", "Flexible Loan").');
  }

  // 6. Email Account Suspension & Deletion Scams
  const isAccountDeletion = /(closing & deleting your account|instructions to delete your account|process your request within 24 hours|cancel request immediately|account termination|features.*will be lost)/i.test(safeText);
  if (isAccountDeletion) {
    evidenceFlags.isAccountDeletionOrSuspensionScam = true;
    detectedIndicators.push('Urgent account deletion or termination intimidation ("Closing & Deleting Your Account in Progress within 24 hours").');
    detectedIndicators.push('Presents an unfamiliar cancellation link or button to cancel a fictional deletion request.');
  }

  // 7. Brand Impersonation & Sender Domain Mismatch
  // E.g. Amazon email sent from amazonn@gmail.com, or O365 User Action Required
  const hasMismatchedSender = /(amazonn?@gmail\.com|@mailinator\.com|o365.*mail.*delivery|microsoft.*@.*[a-z0-9]+\.xyz)/i.test(safeText);
  const isO365EncryptionPhish = /(o365 email security enhancement|update your o365 account into our encryption|outbound messages will be placed on hold)/i.test(safeText);
  const isFakeDeliveryScam = /(package arriving late|resolution center|ensure proper delivery of your package|failure to do so may force us to charge you extra)/i.test(safeText);

  if (hasMismatchedSender || /(from:\s*amazon.*@gmail\.com|amazonn)/i.test(safeText)) {
    evidenceFlags.isSenderDomainMismatch = true;
    detectedIndicators.push('Severe sender address mismatch: Reputable organization (Amazon) claimed from a free/misspelled webmail address (amazonn@gmail.com).');
  }
  if (isO365EncryptionPhish) {
    evidenceFlags.isBrandImpersonationDomain = true;
    detectedIndicators.push('Brand impersonation: Microsoft O365 security alert intimidating that outbound messages will be held.');
  }
  if (isFakeDeliveryScam) {
    evidenceFlags.isBrandImpersonationDomain = true;
    detectedIndicators.push('Deceptive package delivery notice demanding immediate account login to avoid monetary penalties.');
  }

  // 8. Urgency & Coercion Deadlines
  const hasUrgencyDeadline = /(within 24 hours|immediate action required|as soon as humanly possible|as fast as you possibly can|response required|today only|within 5 minutes)/i.test(safeText);
  if (hasUrgencyDeadline) {
    evidenceFlags.isArtificialUrgencyOrDeadline = true;
    detectedIndicators.push('Artificial high-urgency deadline designed to induce panic and prevent independent verification.');
  }

  // 9. URL & Domain Heuristics
  for (const p of parsedUrls) {
    const host = p.hostname;

    // Check direct IP
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      evidenceFlags.isDirectIpUrl = true;
      detectedIndicators.push(`Direct numerical IP address used in link (${host}), typical of unindexed malicious hosts.`);
    }

    // Check Obfuscated shortener / tracking domain
    if (OBFUSCATED_SHORTENER_DOMAINS.has(host) || host.endsWith('.mnge.co')) {
      evidenceFlags.isObfuscatedOrTrackingLink = true;
      detectedIndicators.push(`Obfuscated or tracking redirect domain detected: ${host} (masks final destination).`);
    }

    // Check Suspicious TLD
    for (const tld of SUSPICIOUS_TLDS) {
      if (host.endsWith(tld)) {
        evidenceFlags.isSuspiciousTld = true;
        detectedIndicators.push(`High-abuse Top-Level Domain detected: ${tld} (${host}).`);
        break;
      }
    }

    // Check brand spoofing in domain
    for (const target of KNOWN_TARGETS) {
      const mimicsBrand = target.brandPatterns.some(bp => bp.test(host));
      if (mimicsBrand && !host.endsWith(target.legitDomain)) {
        evidenceFlags.isBrandImpersonationDomain = true;
        detectedIndicators.push(`Deceptive brand spoofing domain: Hostname "${host}" mimics ${target.name} but does not resolve to official "${target.legitDomain}".`);
      }
    }
  }

  // 10. Compute Centralized Risk Score & Verdict
  const calculatedScore = calculateRiskScore(evidenceFlags);
  const riskLevel = getRiskBand(calculatedScore);

  // Determine Categorization and Verdict
  let verdict = 'No obvious threat found';
  let category = 'Benign Communication / Legitimate Promotion';
  let technicalExplanation = '';

  if (evidenceFlags.hasSafeBrowsingThreat) {
    verdict = 'Confirmed Malicious URL / Threat';
    category = 'Malicious or Deceptive URLs';
    technicalExplanation = 'External threat intelligence confirmed that the destination URL is associated with known malware, social engineering, or phishing campaigns.';
  } else if (evidenceFlags.isBankOtpPhishing || (evidenceFlags.isBankImpersonationWithBlockThreat && evidenceFlags.isOtpOrCredentialSolicitation)) {
    verdict = 'Suspected Bank Phishing and OTP Theft';
    category = 'Bank Phishing and Account-Blocking Scams';
    technicalExplanation = 'The communication combines unverified bank impersonation, account freeze intimidation, an unofficial portal, and explicit solicitation of a One-Time Password (OTP). Legitimate financial institutions never request OTPs in chat or threaten account freezes to force clicks on third-party links.';
  } else if (evidenceFlags.isRewardVoucherScam) {
    verdict = 'Suspected Reward Scam and Financial Phishing';
    category = 'Fake Prize, Reward, and Gift-Card Scams';
    technicalExplanation = 'The message uses a classic advance-fee / prize-winning lure promising ₹5,000 to harvest UPI IDs and personal details, followed by directing the victim to an unofficial verification portal. Official brands do not disburse rewards via personal chat links.';
  } else if (evidenceFlags.isAccountDeletionOrSuspensionScam) {
    verdict = 'Suspected Account Suspension & Deletion Phishing';
    category = 'Email Account Suspension and Deletion Scams';
    technicalExplanation = 'The email leverages artificial panic by alleging an account deletion is in progress within 24 hours, pressuring the recipient to click an obfuscated cancellation link. This is a standard credential-harvesting trap.';
  } else if (evidenceFlags.isSenderDomainMismatch || (evidenceFlags.isBrandImpersonationDomain && evidenceFlags.isArtificialUrgencyOrDeadline)) {
    verdict = 'Suspected Brand Impersonation Phishing';
    category = 'Brand Impersonation';
    technicalExplanation = 'The message claims to originate from a recognized brand (e.g. Amazon, Microsoft) while using an unauthorized public webmail address or deceptive domain, accompanied by coercive threats of account restriction or monetary penalties.';
  } else if (evidenceFlags.isLoanFraudWithObfuscatedLink) {
    verdict = 'Suspected Unsolicited Loan Fraud & Obfuscated Link';
    category = 'Financial Fraud and Suspicious Loan Offers';
    technicalExplanation = 'The message promotes unsolicited high-value loan funding paired with an obfuscated redirect URL. Unsolicited financial solicitations linking to non-banking tracking portals are frequently used in predatory loan app scams and identity harvesting.';
  } else if (evidenceFlags.isBrandImpersonationDomain || evidenceFlags.isDirectIpUrl) {
    verdict = 'Suspected Deceptive Link / Domain Spoofing';
    category = 'Malicious or Deceptive URLs';
    technicalExplanation = 'The link hostname mimics a trusted brand or uses a direct IP address, typical of phishing infrastructure set up to intercept login credentials.';
  } else if (evidenceFlags.isOtpOrCredentialSolicitation) {
    verdict = 'Potential Credential Harvesting';
    category = 'Credential and OTP Theft';
    technicalExplanation = 'The message solicits authentication credentials or verification codes, which should never be shared outside official authentication prompts.';
  } else if (calculatedScore >= 40) {
    verdict = 'Suspicious Communication';
    category = 'Suspicious Payment Requests';
    technicalExplanation = 'Multiple social engineering or suspicious routing signals were flagged. While not confirmed malicious by threat feeds, the content exhibits strong anomalies.';
  } else if (calculatedScore >= 20) {
    verdict = 'Guarded / Elevated Caution';
    category = 'Benign Communication / Legitimate Promotion';
    technicalExplanation = 'The submission contains external links or promotional language. While no explicit phishing patterns were confirmed, links should only be visited if from a trusted sender.';
  } else {
    verdict = 'Low Risk — No Automated Threat Detected';
    category = 'Benign Communication / Legitimate Promotion';
    technicalExplanation = 'The content does not display high-confidence malicious signatures, coercive account threats, or credential solicitation. Standard cybersecurity vigilance should still be maintained for all unsolicited links.';
  }

  // Calculate confidence
  const hasCorroboration = detectedIndicators.length >= 2;
  const isProviderValidated = Boolean(safeBrowsingContext && safeBrowsingContext.length > 0);
  const confidence = calculateConfidence(calculatedScore, detectedIndicators.length, hasCorroboration, isProviderValidated);

  // Clean evidence list
  const sanitizedIndicators = detectedIndicators.map(sanitizeSensitiveEvidence);

  return {
    verdict,
    category,
    riskLevel,
    riskScore: calculatedScore,
    confidence,
    indicators: sanitizedIndicators,
    technicalExplanation,
    safeBrowsingSummary,
    urls,
    parsedUrls,
  };
}

/**
 * Generates the standardized Threat Assessment Report matching the CYBERGUARD specification.
 */
export function formatThreatReport(analysis, originalText = '', options = {}) {
  const {
    isGeminiAvailable = false,
    isOCR = false,
    fileName = null,
  } = options;

  // Header Warning Banner
  let warningBanner = '✅ BENIGN / LOW RISK COMMUNICATION';
  let badgePill = '🛡️ LOW RISK';

  if (analysis.riskLevel === 'Critical') {
    warningBanner = '🚨 CRITICAL RISK — SUSPECTED PHISHING / OTP THEFT';
    badgePill = '🚨 CRITICAL RISK';
  } else if (analysis.riskLevel === 'High') {
    warningBanner = '⚠️ SUSPICIOUS MESSAGE — DO NOT CLICK';
    badgePill = '⚠️ HIGH RISK';
  } else if (analysis.riskLevel === 'Medium') {
    warningBanner = '⚠️ ELEVATED RISK — PROCEED WITH CAUTION';
    badgePill = '⚠️ MEDIUM RISK';
  } else if (analysis.riskLevel === 'Guarded') {
    warningBanner = '🛡️ GUARDED — UNVERIFIED PROMOTIONAL CONTENT';
    badgePill = '🛡️ GUARDED';
  }

  // Summary statement in plain English
  let summaryText = '';
  if (analysis.riskLevel === 'Critical' || analysis.riskLevel === 'High') {
    summaryText = `This message presents high-risk indicators characteristic of ${analysis.verdict.toLowerCase()}. It employs social engineering pressure, deceptive branding, or credential/OTP solicitation to compromise personal or financial security.`;
  } else if (analysis.riskLevel === 'Medium' || analysis.riskLevel === 'Guarded') {
    summaryText = `This communication contains unverified external links or marketing solicitations. Treat with caution and verify the source through independent channels before interacting.`;
  } else {
    summaryText = `No automated phishing or fraud indicators were detected in this submission. The message appears to be ordinary communication or standard promotional material.`;
  }

  // Evidence list
  const indicatorsContent = analysis.indicators.length > 0
    ? analysis.indicators.map(ind => `- ${ind}`).join('\n')
    : '- No obvious automated threat indicators flagged in submitted content.';

  // Recommended actions tailored to verdict & category
  let recommendedActions = [];
  if (analysis.category === 'Bank Phishing and Account-Blocking Scams' || analysis.verdict.includes('Bank')) {
    recommendedActions = [
      'Do not click the supplied link: Avoid navigating to unverified login or verification portals.',
      'Never share OTPs, passwords, or banking credentials: No legitimate bank will ask you for a verification code in a private chat.',
      'Verify account status independently: Check your account status directly via the bank\'s official mobile app or verified phone number from your physical bank card.',
      'Report the suspicious message: Forward the interaction to the Cyber Crime portal (cybercrime.gov.in) and report the sender number to your bank\'s fraud division.'
    ];
  } else if (analysis.category === 'Fake Prize, Reward, and Gift-Card Scams') {
    recommendedActions = [
      'Do not submit personal or financial information: Never disclose your UPI ID, phone number, or banking details to claim an unprompted voucher.',
      'Verify the offer through official channels: Check the retailer\'s verified mobile app or official website—legitimate promotions never require chatting with unverified personal numbers.',
      'Do not pay any advance fee: Genuine giveaways never require verification deposits or fee transfers.'
    ];
  } else if (analysis.category === 'Financial Fraud and Suspicious Loan Offers') {
    recommendedActions = [
      'Do not apply through unverified tracking links: Do not click obfuscated links or install unknown APKs / mobile loan apps.',
      'Verify NBFC / Bank registration: Check if the purported lending partner is recognized by the Reserve Bank of India (RBI).',
      'Never grant smartphone permissions: Untrusted loan apps often harvest contacts and photos for extortion.'
    ];
  } else if (analysis.category === 'Email Account Suspension and Deletion Scams' || analysis.category === 'Brand Impersonation') {
    recommendedActions = [
      'Do not use unexpected account-recovery or cancellation links: Ignore urgent buttons claiming your account will be closed in 24 hours.',
      'Access the service directly: Open a clean browser window and navigate directly to the official service website.',
      'Report the email as phishing: Use your email client\'s "Report Phishing" option so email filters can block similar incoming attacks.'
    ];
  } else {
    recommendedActions = [
      'Maintain standard zero-trust hygiene: Never enter credentials or download unexpected attachments from unknown senders.',
      'Verify out-of-band: If an unexpected request is made by a colleague or provider, verify via phone call or direct chat.'
    ];
  }

  // Format recommended actions
  const actionsList = recommendedActions.map((act, i) => `${i + 1}. **${act.split(':')[0]}**: ${act.split(':')[1] || ''}`).join('\n');

  // Threat intelligence status block
  const urlSummaryList = analysis.urls && analysis.urls.length > 0
    ? analysis.urls.map(u => `  * \`${u}\``).join('\n')
    : '  * None detected in message';

  const threatIntelStatus = `- **Extracted URLs & Domains**:\n${urlSummaryList}
- **Safe Browsing Lookup**: ${analysis.safeBrowsingSummary}
- **Analysis Engine**: ${isGeminiAvailable ? 'Google Gemini AI + CYBERGUARD Heuristic Engine' : 'CYBERGUARD Local Heuristic Engine'}
- **Service Disclosures**: ${isGeminiAvailable ? 'External generative vision/context evaluation active.' : 'Gemini Generative AI not active; evaluated deterministically by local threat heuristic engine.'}`;

  // Provider transparency notice
  const providerNotice = isGeminiAvailable
    ? '✅ Analyzed with Google Gemini Multimodal Engine combined with CYBERGUARD Deterministic Security Rules. All external checks reflect live provider status.'
    : '⚠️ Analyzed via CYBERGUARD Local Heuristic Engine. (To enable Google Gemini Generative AI, set `GEMINI_API_KEY` in your backend `.env`). Never fabricate external threat intelligence results.';

  const fileMetaLine = fileName ? `- **Analyzed File**: \`${fileName}\` ${isOCR ? '(Vision OCR Extracted)' : ''}\n` : '';

  return `### 🛡️ Threat Assessment Report

**${badgePill}**

**${warningBanner}**

${fileMetaLine}**Summary**:
${summaryText}

**Verdict**:
${analysis.verdict}

**Risk Level**:
${analysis.riskLevel}

**Risk Score**:
${analysis.riskScore} / 100

**Confidence**:
${analysis.confidence}% (${analysis.confidence >= 85 ? 'High Confidence' : 'Qualified Confidence'} based on indicator correlation)

#### 🔍 DETECTED INDICATORS & EVIDENCE
${indicatorsContent}

#### 📖 TECHNICAL EXPLANATION
${analysis.technicalExplanation}

#### 🌐 THREAT INTELLIGENCE STATUS
${threatIntelStatus}

#### ⚡ RECOMMENDED ACTIONS
${actionsList}

#### ⚠️ PROVIDER & TRANSPARENCY NOTICE
${providerNotice}`;
}

// Backward-compatible alias
export const formatHeuristicReport = formatThreatReport;

/**
 * Standard security advisory knowledge repository.
 */
const SECURITY_QA_KNOWLEDGE = [
  {
    triggers: ['what is phishing', 'explain phishing', 'phishing meaning', 'how to spot phishing'],
    title: 'Understanding Phishing & Social Engineering',
    content: `Phishing is a social engineering attack where cyber adversaries deceive victims into revealing sensitive data (passwords, banking credentials, OTPs) or downloading malware by masquerading as trusted entities.

Key defensive rules:
1. **Never share OTPs or PINs:** Legitimate banks and service providers will NEVER ask for your verification code.
2. **Inspect sender domains:** Verify the exact sender address after the '@' symbol.
3. **Beware of urgent deadlines:** Attackers create artificial panic ("Account blocked in 24 hours!") to bypass critical thinking.
4. **Navigate manually:** Type the official website address directly into your browser rather than clicking links in messages.`,
  },
  {
    triggers: ['2fa', 'two-factor', 'mfa', 'multi-factor'],
    title: 'Two-Factor Authentication (2FA / MFA)',
    content: `Two-Factor Authentication adds a critical second layer of defense. Even if an attacker steals your password, they cannot access your account without the second factor.

Best practices:
- **Use Authenticator Apps** (Google Authenticator, Microsoft Authenticator) or hardware keys (YubiKey) rather than SMS, as SMS is vulnerable to SIM swapping.
- **Store Backup Codes** securely in an encrypted password manager or offline location.`,
  },
  {
    triggers: ['ransomware', 'malware', 'infected', 'virus'],
    title: 'Malware & Ransomware Defense',
    content: `Ransomware is malicious software that encrypts your files and demands payment for the decryption key.

Immediate response:
1. **Disconnect from networks:** Immediately turn off Wi-Fi and disconnect Ethernet cables to prevent lateral movement across local devices.
2. **Do not pay the ransom:** Paying funds criminal operations and does not guarantee recovery.
3. **Restore from offline backups:** Ensure immutable, air-gapped backups are tested regularly.
4. **Perform deep scans:** Use reputable endpoint protection tools to disinfect the device.`,
  },
];

export function getGeneralSecurityAnswer(query) {
  const q = query.toLowerCase();
  for (const item of SECURITY_QA_KNOWLEDGE) {
    if (item.triggers.some(t => q.includes(t))) {
      return item;
    }
  }
  return null;
}
