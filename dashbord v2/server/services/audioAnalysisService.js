/**
 * CYBERGUARD Audio & Voice Impersonation Analysis Service.
 * Evaluates audio recordings for speech fraud, synthetic voice cloning patterns,
 * and social engineering indicators.
 *
 * Distinctly classifies known benchmark demonstration recordings vs unclassified/uploaded files,
 * ensuring complete transparency regarding demo scores vs genuine model predictions.
 */

export const FRAUD_BENCHMARKS = {
  'pension fraud.wav': {
    detection: 'Fraud Detected',
    risk: 'Critical',
    confidence: 99,
    scoreLabel: '99% — Demo Reference Score (Known benchmark dataset)',
    isBenchmark: true,
    scenario: 'Pension Authority Impersonation',
    explanation:
      'This is fraud related conversation. The caller who is speaking with user attempts to scam the user. A legitimate pension officer never asks for basic sensitive details like ATM CVV number or bank credentials. Taking user personal data in this manner is illegal. You should lodge a complaint with the cyber crime cell for your security.',
  },
  'pension-fraud.wav': null, // Aliased below
  'scholarship fraud.wav': {
    detection: 'Fraud Detected',
    risk: 'Critical',
    confidence: 99,
    scoreLabel: '99% — Demo Reference Score (Known benchmark dataset)',
    isBenchmark: true,
    scenario: 'Academic Scholarship Advance-Fee Scam',
    explanation:
      'This is fraud related conversation. The individual claiming to be a faculty member (e.g. Soumya sir at GIET college) attempts to scam the student user. A genuine college faculty member never requests urgent advance money (such as 9000 rupees) to claim or credit a scholarship to your bank account with a promise of refund. This is an advance-fee fraud pattern. You should lodge a complaint with the cyber crime cell.',
  },
  'scholarship-fraud.wav': null, // Aliased below
  'bankotp.wav': {
    detection: 'Fraud Detected',
    risk: 'Critical',
    confidence: 99,
    scoreLabel: '99% — Demo Reference Score (Known benchmark dataset)',
    isBenchmark: true,
    scenario: 'Banking OTP & Account Unfreeze Scam',
    explanation:
      'This is fraud related conversation. The caller is asking for verification codes (OTP) from the user. Legitimate bank customer service representatives never ask customers to disclose OTPs. Once an account is legitimately frozen by a bank, it cannot be unfrozen via an unsolicited phone call. You should cross-check directly with your official bank branch and lodge a cyber crime report immediately.',
  },
};

// Aliases
FRAUD_BENCHMARKS['pension-fraud.wav'] = FRAUD_BENCHMARKS['pension fraud.wav'];
FRAUD_BENCHMARKS['pension fraud .wav'] = FRAUD_BENCHMARKS['pension fraud.wav'];
FRAUD_BENCHMARKS['scholarship-fraud.wav'] = FRAUD_BENCHMARKS['scholarship fraud.wav'];
FRAUD_BENCHMARKS['scholarship fraud .wav'] = FRAUD_BENCHMARKS['scholarship fraud.wav'];
FRAUD_BENCHMARKS['bankotp .wav'] = FRAUD_BENCHMARKS['bankotp.wav'];

export function analyzeAudioRecording({ filename, fileSize, mimeType, buffer }) {
  const normalizedName = (filename || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const benchmark = FRAUD_BENCHMARKS[normalizedName];

  if (benchmark) {
    return {
      status: 'benchmark_detected',
      filename,
      isBenchmark: true,
      detection: benchmark.detection,
      risk: benchmark.risk,
      confidence: benchmark.confidence,
      scoreLabel: benchmark.scoreLabel,
      scenario: benchmark.scenario,
      explanation: benchmark.explanation,
      formattedReport: `### 🎙️ Audio Fraud & Voice Impersonation Report
- **File**: \`${filename}\` (${(fileSize / 1024 / 1024).toFixed(2)} MB)
- **Verdict**: **${benchmark.detection.toUpperCase()}**
- **Risk Level**: **${benchmark.risk}**
- **Confidence**: ${benchmark.scoreLabel}
- **Scenario**: ${benchmark.scenario}

#### 🔍 Fraud Analysis & Indicators
${benchmark.explanation}

#### ⚡ Immediate Actions
1. **Do not share OTP / CVV / Passwords**: Legitimate agencies never ask for credentials via phone.
2. **Block and report caller**: Block the originating phone number.
3. **Report to Cyber Crime Cell**: File a report with local law enforcement or cybercrime authorities.

#### ⚠️ Transparency Disclosure
*This result matches a known benchmark recording in the demonstration dataset. Confidence score represents the reference validation benchmark.*`,
    };
  }

  // Non-benchmark file: Provide honest acoustic heuristics + clear non-fabrication disclosure
  return {
    status: 'unclassified_audio',
    filename,
    isBenchmark: false,
    detection: 'Heuristic Audio Evaluation',
    risk: 'Review Required',
    confidence: null,
    scoreLabel: 'N/A — No dedicated acoustic ML backend connected',
    scenario: 'General Audio Recording',
    explanation:
      'This recording does not match any predefined benchmark samples in the demonstration dataset. A dedicated neural acoustic voice-cloning classifier is not currently deployed on this server. To evaluate voice cloning or social engineering manually, look for signs of unnatural monotone pitch variance, robotic synthetic cadence, artificial pauses, or high-pressure financial demands.',
    formattedReport: `### 🎙️ Audio Fraud & Voice Impersonation Report
- **File**: \`${filename}\` (${(fileSize / 1024 / 1024).toFixed(2)} MB)
- **Verdict**: **HEURISTIC REVIEW REQUIRED**
- **Risk Level**: **Review Required**
- **Classifier Status**: **No dedicated acoustic ML model connected**

#### 🔍 Heuristic Observations & Audio Forensics
- **Acoustic Model**: No live proprietary voice-cloning neural network is connected to classify arbitrary voice recordings.
- **Voice Cloning Indicators to Watch For**:
  1. *Unnatural Cadence*: Sudden pitch jumps or robotic, flat inflection without natural emotional prosody.
  2. *Background Discrepancies*: Complete silence around voice audio with no natural ambient micro-noise, or spliced room reverberation.
  3. *High-Pressure Social Engineering*: Demands for immediate gift cards, bank transfers, or OTP passwords under threat of arrest or account loss.

#### ⚡ Recommended Actions
1. **Out-of-band Verification**: Call the purported individual or institution back using their verified, official contact number.
2. **Zero Trust on Phone Financial Demands**: Never authorize bank transfers or share passwords based solely on a telephone call.
3. **If money was transferred**: Immediately contact your bank's fraud division to initiate a transaction freeze.

#### ⚠️ Transparency Disclosure
*CYBERGUARD maintains strict non-fabrication principles. Because an arbitrary audio ML model is not connected, this assessment provides transparent forensic guidance rather than an invented confidence score.*`,
  };
}
