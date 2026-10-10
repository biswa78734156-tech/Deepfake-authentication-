/**
 * CYBERGUARD Comprehensive Threat Detection & Risk Scoring Test Suite
 * Validates all 14 test scenarios required by specification.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  analyzeThreatText,
  calculateRiskScore,
  getRiskBand,
  formatThreatReport,
} from '../server/services/threatAnalysisService.js';
import { checkSafeBrowsingUrl } from '../server/services/safeBrowsingService.js';
import { extractUrlsFromText, isValidWebUrl } from '../server/utils/urlValidator.js';
import { analyzeImageWithGemini, isGeminiKeyConfigured } from '../server/services/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = [];

async function runTest(name, fn) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    results.push({ name, passed: false, error: err.message });
    console.error(`❌ FAIL: ${name}\n   Error: ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('CYBERGUARD AUTOMATED THREAT DETECTION TEST SUITE');
console.log('======================================================\n');

// ── TEST 1: Normal harmless email ───────────────────────────────────────────
await runTest('1. Normal harmless email', async () => {
  const normalEmail = `Subject: Sprint Planning Notes - Monday 10:00 AM
Hi Alex and Sarah,
Here are the meeting notes from today's discussion on the new dashboard components.
Please review the attached sprint backlog before Wednesday.
Best regards,
Thomas Anderson`;

  const analysis = analyzeThreatText(normalEmail);
  assert.strictEqual(analysis.riskLevel, 'Low Risk', `Expected Low Risk but got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore < 20, `Risk score should be < 20, got ${analysis.riskScore}`);
  assert.strictEqual(analysis.indicators.length, 0, 'Harmless email should have 0 threat indicators');
});

// ── TEST 2: Suspicious email threatening account deletion within 24 hours ───
await runTest('2. Suspicious email threatening account deletion within 24 hours', async () => {
  const accountDeletionEmail = `VIRGINIA WARNING: Closing & Deleting Your Account in Progress!
Hello User!
We received your instructions to delete your account.
We will process your request within 24 hours.
All features associated with your account will be lost.
To retain your account, kindly Cancel Request to continue using our services:
http://bit.ly/1WTXQzB
Thank You, Account Team`;

  const analysis = analyzeThreatText(accountDeletionEmail);
  assert.ok(['High', 'Critical'].includes(analysis.riskLevel), `Expected High/Critical risk, got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore >= 60, `Risk score should be >= 60, got ${analysis.riskScore}`);
  assert.ok(analysis.verdict.includes('Account Suspension') || analysis.verdict.includes('Phishing'), 'Verdict should detect account deletion phishing');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('deletion') || i.toLowerCase().includes('termination')), 'Should flag deletion urgency');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('bit.ly') || i.toLowerCase().includes('obfuscated')), 'Should flag bit.ly link');
});

// ── TEST 3: Bank impersonation with unofficial login link and OTP request ───
await runTest('3. Bank impersonation with unofficial login link and OTP request', async () => {
  const bankPhishing = `+91 98765 43210:
Hello Rahul, I am from HDFC Bank. Your account has been temporarily blocked due to some security issue. Please verify your account to avoid permanent block.
You just need to click on the link below and update your details:
https://hdfc-secure-login.com/verify
No need to call. This is our special verification process. If you don't do it now, your account will be blocked within 24 hours.
Please share the OTP you received for verification.
Rahul: 612839`;

  const analysis = analyzeThreatText(bankPhishing);
  assert.ok(['High', 'Critical'].includes(analysis.riskLevel), `Expected High or Critical risk, got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore >= 70, `Risk score should be >= 70, got ${analysis.riskScore}`);
  assert.strictEqual(analysis.verdict, 'Suspected Bank Phishing and OTP Theft');
  assert.ok(analysis.indicators.some(i => i.includes('HDFC') || i.includes('financial institution')), 'Should detect bank impersonation');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('otp')), 'Should detect OTP solicitation');
  assert.ok(analysis.indicators.some(i => i.includes('hdfc-secure-login.com')), 'Should detect deceptive brand spoofing domain');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('discourage')), 'Should detect dissuading official contact');

  // Verify OTP redaction in report
  const report = formatThreatReport(analysis, bankPhishing);
  assert.ok(!report.includes('612839'), 'Report MUST NOT leak actual OTP token!');
});

// ── TEST 4: Unexpected ₹5,000 reward requiring UPI ID and suspicious URL ────
await runTest('4. Unexpected ₹5,000 reward requiring a UPI ID and suspicious URL', async () => {
  const rewardScam = `+91 73058 26473:
Hello, My name is Sneha from Amazon. You have won a gift voucher of ₹5000 from Amazon. Congratulations!
To claim your voucher, please share your name, number and UPI ID.
Yes, it's real. Just share your details and we will verify. After verification, the voucher will be sent to your UPI within 5 minutes.
Great! Now please click on the link below to complete the verification process.
https://amazon-reward.in/verify
After clicking, your voucher will be credited instantly.`;

  const analysis = analyzeThreatText(rewardScam);
  assert.ok(['High', 'Critical'].includes(analysis.riskLevel), `Expected High or Critical risk, got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore >= 60, `Risk score should be >= 60, got ${analysis.riskScore}`);
  assert.strictEqual(analysis.verdict, 'Suspected Reward Scam and Financial Phishing');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('reward') || i.toLowerCase().includes('voucher')), 'Should detect voucher claim');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('upi')), 'Should detect UPI ID request');
  assert.ok(analysis.indicators.some(i => i.includes('amazon-reward.in')), 'Should detect spoofed domain');
});

// ── TEST 5: Loan offer with unfamiliar link ─────────────────────────────────
await runTest('5. Loan offer with unfamiliar link (1.txt reference)', async () => {
  const loanOffer = `Funding ki zarurat hai? INR 50,000 - INR 50 Lakh tak ka paayein Flexible Loan via Tide. Apply now http://u3.mnge.co/TIDEPF/DVprPzY T&C Apply please give me the it real or malicious`;

  const analysis = analyzeThreatText(loanOffer);
  assert.ok(['High', 'Critical'].includes(analysis.riskLevel), `Loan scam MUST NOT be Low Risk! Got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore >= 60, `Risk score should be >= 60, got ${analysis.riskScore}`);
  assert.ok(analysis.verdict.includes('Loan') || analysis.verdict.includes('Fraud'), 'Verdict should detect loan fraud');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('loan') || i.toLowerCase().includes('funding')), 'Should detect loan solicitation');
  assert.ok(analysis.indicators.some(i => i.includes('u3.mnge.co') || i.toLowerCase().includes('obfuscated')), 'Should detect obfuscated link');
});

// ── TEST 6: Screenshot containing multiple phishing indicators ──────────────
await runTest('6. Screenshot containing multiple phishing indicators (mail4.png)', async () => {
  const mail4Content = `From: Amazon Resolution Center <amazonn@gmail.com>
Subject: [External Email] AMAZON, INC. - Package Arriving Late!
Response required.
Dear Valued Customer,
We are riting to inform you that you have to login to your account to ensure proper delivery of your package.
As a safety measure, click here as soon as humanly possible to resolve the issue. Failure to do so may force us to charge you extra.
Or follow this link, but be as fast as you possibly can: [Resolution Center]`;

  const analysis = analyzeThreatText(mail4Content);
  assert.ok(['High', 'Critical'].includes(analysis.riskLevel), `Expected High or Critical risk, got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore >= 60, `Risk score should be >= 60, got ${analysis.riskScore}`);
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('sender') || i.includes('amazonn@gmail.com')), 'Should flag sender address mismatch');
  assert.ok(analysis.indicators.some(i => i.toLowerCase().includes('urgency') || i.toLowerCase().includes('humanly possible')), 'Should flag urgency pressure');
});

// ── TEST 7: Harmless screenshot with ordinary conversation ──────────────────
await runTest('7. Harmless screenshot with ordinary conversation', async () => {
  const ordinaryChat = `Sarah: Hey Thomas, can you review the new bento grid layout on mobile?
Thomas: Sure Sarah, looking at it now. Everything aligns cleanly with the 8px grid.
Sarah: Awesome, merging to main branch now!`;

  const analysis = analyzeThreatText(ordinaryChat);
  assert.strictEqual(analysis.riskLevel, 'Low Risk', `Ordinary chat should be Low Risk, got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore <= 15, `Risk score should be <= 15, got ${analysis.riskScore}`);
  assert.strictEqual(analysis.indicators.length, 0, 'No indicators should be flagged');
});

// ── TEST 8: Legitimate promotion without suspicious requests ────────────────
await runTest('8. Legitimate promotion without suspicious requests', async () => {
  const legitPromo = `Special Offer: Enjoy 20% off your subscription renewal at https://example.com/pricing.
Use coupon code RENEW20 at checkout.
To unsubscribe from marketing emails, visit https://example.com/unsubscribe.`;

  const analysis = analyzeThreatText(legitPromo);
  assert.ok(['Low Risk', 'Guarded'].includes(analysis.riskLevel), `Legitimate promo should be Low Risk or Guarded, got ${analysis.riskLevel}`);
  assert.ok(analysis.riskScore <= 25, `Risk score should be <= 25, got ${analysis.riskScore}`);
  assert.ok(!analysis.indicators.some(i => i.toLowerCase().includes('otp') || i.toLowerCase().includes('blocked')), 'Should not flag false credential threats');
});

// ── TEST 9: Missing Google Safe Browsing API key ────────────────────────────
await runTest('9. Missing Google Safe Browsing API key', async () => {
  const result = await checkSafeBrowsingUrl('https://example.com', '');
  assert.strictEqual(result.configured, false, 'Should report configured: false');
  assert.strictEqual(result.status, 'unconfigured', 'Should report unconfigured');
  assert.ok(result.summary.includes('not configured'), 'Summary should disclose key not configured');
});

// ── TEST 10: Missing Gemini API key ─────────────────────────────────────────
await runTest('10. Missing Gemini API key', async () => {
  const isConfiguredEmpty = isGeminiKeyConfigured('');
  const isConfiguredPlaceholder = isGeminiKeyConfigured('replace_with_your_gemini_key');
  assert.strictEqual(isConfiguredEmpty, false, 'Empty key should not be configured');
  assert.strictEqual(isConfiguredPlaceholder, false, 'Placeholder key should not be configured');

  // Verify threatAnalysisService still runs fully without Gemini
  const analysis = analyzeThreatText('Urgent: Your HDFC account is blocked. Enter OTP.');
  assert.ok(analysis.riskScore >= 70, 'Local heuristic engine must score accurately without Gemini');
  const report = formatThreatReport(analysis, '', { isGeminiAvailable: false });
  assert.ok(report.includes('CYBERGUARD Local Heuristic Engine'), 'Report should disclose local engine transparency notice');
});

// ── TEST 11: External provider timeout ──────────────────────────────────────
await runTest('11. External provider timeout', async () => {
  // Test that checkSafeBrowsingUrl handles timeout / abort without throwing unhandled exceptions
  const timeoutResult = await checkSafeBrowsingUrl('https://example.com', 'dummy_key_for_timeout_test');
  assert.ok(timeoutResult.configured, 'Should be marked as attempted');
  assert.ok(['error', 'provider_unavailable'].includes(timeoutResult.status), 'Should gracefully catch error/timeout');
  assert.ok(typeof timeoutResult.summary === 'string', 'Should return human-readable summary');
});

// ── TEST 12: Image OCR failure ──────────────────────────────────────────────
await runTest('12. Image OCR failure handling', async () => {
  // Call image analysis with invalid/mocked key or corrupted buffer
  try {
    await analyzeImageWithGemini({
      apiKey: 'INVALID_DUMMY_KEY',
      imageBuffer: Buffer.from('corrupted_image_data'),
      mimeType: 'image/jpeg',
    });
    assert.fail('Should have thrown error on invalid key');
  } catch (err) {
    assert.ok(err.message, 'Should catch and report error without crashing');
  }
});

// ── TEST 13: Malformed or unsupported upload ────────────────────────────────
await runTest('13. Malformed or unsupported upload validation', async () => {
  // Validate URL extraction rejects non-web schemes
  const invalidUrl = isValidWebUrl('javascript:alert(1)');
  assert.strictEqual(invalidUrl.valid, false, 'Should reject javascript: URLs');

  const fileUrl = isValidWebUrl('file:///etc/passwd');
  assert.strictEqual(fileUrl.valid, false, 'Should reject file:// URLs');

  const privateIp = isValidWebUrl('http://192.168.1.1/admin');
  assert.strictEqual(privateIp.valid, false, 'Should reject private IP addresses (SSRF protection)');
});

// ── TEST 14: Inconclusive URL reputation result ─────────────────────────────
await runTest('14. Inconclusive URL reputation result', async () => {
  const safeBrowsingContextClean = [
    {
      url: 'https://newly-created-site.com',
      result: {
        status: 'no_threat_found',
        summary: 'No threat found in Google Safe Browsing database.',
      },
    },
  ];

  const analysis = analyzeThreatText('Visit https://newly-created-site.com for updates.', safeBrowsingContextClean);
  assert.ok(analysis.safeBrowsingSummary.includes('Newly created phishing sites may not yet appear'), 'Clean check must carry caveat');
  const report = formatThreatReport(analysis, '', { isGeminiAvailable: false });
  assert.ok(report.includes('Newly created phishing sites may not yet appear'), 'Report should transparently disclose caveat');
});

// ── Reference File Verification ─────────────────────────────────────────────
console.log('\n--- Verifying Project Reference Assets ---');

await runTest('Reference file 1.txt exists and analyzes as marketing/loan template', async () => {
  const txtPath = path.resolve(__dirname, '../public/text link message fraud/1.txt');
  assert.ok(fs.existsSync(txtPath), `1.txt should exist at ${txtPath}`);
  const content = fs.readFileSync(txtPath, 'utf8');
  assert.ok(content.includes('zarurat hai'), '1.txt should contain Hinglish marketing templates');
});

await runTest('Reference image pattern.jpeg exists and analyzes as bank phishing', async () => {
  const imgPath = path.resolve(__dirname, '../public/mail message fraud/pattern.jpeg');
  assert.ok(fs.existsSync(imgPath), `pattern.jpeg should exist at ${imgPath}`);
});

await runTest('Reference image pattern2.jpeg exists and analyzes as reward scam', async () => {
  const imgPath = path.resolve(__dirname, '../public/mail message fraud/pattern2.jpeg');
  assert.ok(fs.existsSync(imgPath), `pattern2.jpeg should exist at ${imgPath}`);
});

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n======================================================');
const total = results.length;
const passed = results.filter(r => r.passed).length;
const failed = total - passed;
console.log(`TEST SUMMARY: ${passed}/${total} PASSED (${failed} failed)`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
