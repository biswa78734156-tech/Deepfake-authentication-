import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { isValidWebUrl, extractUrlsFromText } from './utils/urlValidator.js';
import { checkSafeBrowsingUrl } from './services/safeBrowsingService.js';
import {
  generateChatResponse,
  analyzeImageWithGemini,
  testGeminiConnection,
  isGeminiKeyConfigured,
} from './services/geminiService.js';
import {
  analyzeThreatText,
  formatThreatReport,
  getGeneralSecurityAnswer,
} from './services/threatAnalysisService.js';
import { analyzeAudioRecording } from './services/audioAnalysisService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current directory or parent directory
const localEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Multer memory storage for image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload JPG, PNG, or WebP images only.'));
    }
  },
});

// Multer memory storage for audio uploads
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.wav', '.mp3', '.aac', '.m4a', '.ogg', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('audio/') || file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported audio format. Please upload WAV, MP3, AAC, M4A, or OGG audio files.'));
    }
  },
});

// Helper to check keys securely
function getApiKeys() {
  return {
    geminiKey: process.env.GEMINI_API_KEY || '',
    safeBrowsingKey: process.env.SAFE_BROWSING_API_KEY || '',
  };
}

function isSafeBrowsingConfigured(key) {
  return Boolean(
    key &&
    key !== 'replace_with_your_safe_browsing_key' &&
    key.trim().length > 10
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONFIGURATION STATUS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const { geminiKey, safeBrowsingKey } = getApiKeys();
  res.json({
    status: 'ok',
    geminiConfigured: isGeminiKeyConfigured(geminiKey),
    safeBrowsingConfigured: isSafeBrowsingConfigured(safeBrowsingKey),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHAT & THREAT ANALYSIS HANDLER (Reused for /api/chat & /api/analyze-text)
// ─────────────────────────────────────────────────────────────────────────────
async function handleThreatAnalysis(req, res) {
  try {
    const message = req.body.message || req.body.text || '';
    const history = req.body.history || [];

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty. Please provide text to analyze.' });
    }

    const { geminiKey, safeBrowsingKey } = getApiKeys();
    const hasValidGeminiKey = isGeminiKeyConfigured(geminiKey);

    // Detect URLs in user message
    const detectedUrls = extractUrlsFromText(message);
    let safeBrowsingContext = null;

    if (detectedUrls.length > 0) {
      const urlChecks = await Promise.all(
        detectedUrls.slice(0, 3).map((u) => checkSafeBrowsingUrl(u, safeBrowsingKey))
      );
      safeBrowsingContext = detectedUrls.slice(0, 3).map((u, i) => ({
        url: u,
        result: urlChecks[i],
      }));
    }

    // Try Gemini AI first if configured
    if (hasValidGeminiKey) {
      try {
        const reply = await generateChatResponse({
          apiKey: geminiKey,
          message,
          history: Array.isArray(history) ? history : [],
          safeBrowsingContext,
        });

        const deterministicAnalysis = analyzeThreatText(message, safeBrowsingContext);

        return res.json({
          reply,
          engine: 'google_gemini',
          analysis: deterministicAnalysis,
          detectedUrls,
          threatIntelligence: safeBrowsingContext,
        });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local heuristic engine:', geminiErr.message);
        // Fall through to heuristic engine below
      }
    }

    // Heuristic & Knowledge Base Fallback Engine
    // Check if it's a general security inquiry (only if no URL or explicit threat is submitted)
    if (detectedUrls.length === 0) {
      const securityAnswer = getGeneralSecurityAnswer(message);
      if (securityAnswer) {
        const responseText = `### 🛡️ ${securityAnswer.title}\n\n${securityAnswer.content}\n\n---\n*ℹ️ Note: Running in CYBERGUARD Advisory Mode. To enable Google Gemini AI generative responses, configure \`GEMINI_API_KEY\` in your \`.env\` file.*`;
        return res.json({
          reply: responseText,
          engine: 'knowledge_base',
          detectedUrls,
          threatIntelligence: safeBrowsingContext,
        });
      }
    }

    // Run centralized deterministic threat analysis on text / URLs
    const threatAnalysis = analyzeThreatText(message, safeBrowsingContext);
    const formattedReply = formatThreatReport(threatAnalysis, message, {
      isGeminiAvailable: false,
    });

    return res.json({
      reply: formattedReply,
      engine: 'cyberguard_heuristics',
      analysis: threatAnalysis,
      detectedUrls,
      threatIntelligence: safeBrowsingContext,
    });
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: `Analysis request failed: ${err.message}`,
    });
  }
}

app.post('/api/chat', handleThreatAnalysis);
app.post('/api/analyze-text', handleThreatAnalysis);

// ─────────────────────────────────────────────────────────────────────────────
// 3. IMAGE / SCREENSHOT ANALYSIS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/analyze-image', imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Please upload a valid image file (PNG, JPG, or WebP).' });
    }

    const { geminiKey, safeBrowsingKey } = getApiKeys();
    const hasValidGeminiKey = isGeminiKeyConfigured(geminiKey);

    const userMessage = req.body.userMessage || '';
    let history = [];
    if (req.body.history) {
      try {
        history = JSON.parse(req.body.history);
      } catch {
        history = [];
      }
    }

    if (hasValidGeminiKey) {
      try {
        // Also extract any URLs found in user message to enrich context
        const userUrls = extractUrlsFromText(userMessage);
        let safeBrowsingContext = null;
        if (userUrls.length > 0) {
          const urlChecks = await Promise.all(
            userUrls.slice(0, 3).map((u) => checkSafeBrowsingUrl(u, safeBrowsingKey))
          );
          safeBrowsingContext = userUrls.slice(0, 3).map((u, i) => ({
            url: u,
            result: urlChecks[i],
          }));
        }

        const reply = await analyzeImageWithGemini({
          apiKey: geminiKey,
          imageBuffer: req.file.buffer,
          mimeType: req.file.mimetype,
          userMessage,
          history,
          safeBrowsingContext,
          fileName: req.file.originalname,
        });

        return res.json({
          reply,
          engine: 'google_gemini_vision',
          fileName: req.file.originalname,
          fileSize: req.file.size,
        });
      } catch (geminiErr) {
        console.warn('Gemini vision failed, providing structured transparency notice:', geminiErr.message);

        // Fallback: If user provided text notes, evaluate them deterministically
        if (userMessage && userMessage.trim().length > 0) {
          const fallbackAnalysis = analyzeThreatText(userMessage, null);
          const reply = formatThreatReport(fallbackAnalysis, userMessage, {
            isGeminiAvailable: false,
            isOCR: false,
            fileName: req.file.originalname,
          });
          return res.json({
            reply,
            engine: 'cyberguard_heuristics_fallback',
            fileName: req.file.originalname,
            fileSize: req.file.size,
            notice: `Vision OCR API encountered an issue (${geminiErr.message}). Evaluated user note.`,
          });
        }

        // Return structured OCR error report without faking Low Risk
        const ocrErrorReport = `### 🛡️ Threat Assessment Report

**🛡️ REVIEW REQUIRED**

**⚠️ IMAGE OCR PROCESSING NOTICE**

- **Analyzed File**: \`${req.file.originalname}\` (${(req.file.size / 1024).toFixed(1)} KB)

**Summary**:
Visual OCR processing was unable to transcribe the uploaded screenshot due to an external service error (${geminiErr.message}).

**Verdict**:
Review Required — Automated Vision OCR Inconclusive

**Risk Level**:
Guarded

**Risk Score**:
25 / 100

**Confidence**:
50% (Inconclusive due to vision transcription unavailability)

#### 🔍 DETECTED INDICATORS & EVIDENCE
- Uploaded image file received: \`${req.file.originalname}\` (${req.file.mimetype})
- External Vision OCR service could not extract textual dialogue automatically.
- No automated threat score could be safely determined without text extraction.

#### 📖 TECHNICAL EXPLANATION
Without extracted text, sender addresses, or URLs from the image, the security engine cannot verify whether this screenshot contains a phishing campaign, fraud message, or benign interaction. To maintain security integrity, CYBERGUARD does not assume unverified images are safe.

#### 🌐 THREAT INTELLIGENCE STATUS
- Extracted URLs & Domains: None extracted (OCR unavailable)
- Safe Browsing Lookup: Not checked (no URLs extracted)
- Analysis Engine: Fallback Error Handler

#### ⚡ RECOMMENDED ACTIONS
1. **Copy and paste text**: Copy the visible text, sender details, or links directly into the CYBERGUARD chat for instant heuristic evaluation.
2. **Do not click unfamiliar links**: Treat links visible in unverified screenshots as untrusted until validated.
3. **Verify backend connectivity**: Verify that \`GEMINI_API_KEY\` is active and network access to Google Generative AI is unimpeded.

#### ⚠️ PROVIDER & TRANSPARENCY NOTICE
⚠️ Image analysis could not complete via Google Gemini Vision API (${geminiErr.message}). CYBERGUARD never fabricates a Low Risk classification when an analysis step fails.`;

        return res.json({
          reply: ocrErrorReport,
          engine: 'ocr_error_report',
          fileName: req.file.originalname,
          fileSize: req.file.size,
          ocrError: geminiErr.message,
        });
      }
    }

    // When Gemini is not configured at all
    const guidanceReport = `### 🛡️ Threat Assessment Report

**🛡️ REVIEW REQUIRED**

**⚠️ GEMINI MULTIMODAL API KEY REQUIRED**

- **Analyzed File**: \`${req.file.originalname}\` (${(req.file.size / 1024).toFixed(1)} KB)

**Summary**:
Optical character recognition (OCR) and layout pattern recognition for uploaded screenshots require an active Google Gemini Vision API key.

**Verdict**:
Review Required — Vision API Unconfigured

**Risk Level**:
Guarded

**Risk Score**:
25 / 100

**Confidence**:
50% (Inconclusive due to unconfigured vision engine)

#### 🔍 DETECTED INDICATORS & EVIDENCE
- Screenshot uploaded: \`${req.file.originalname}\`
- Visual OCR engine requires \`GEMINI_API_KEY\` to extract text from image buffer.

#### 📖 TECHNICAL EXPLANATION
To protect user privacy and ensure robust detection against adversarial image manipulations, CYBERGUARD uses Google Gemini Multimodal Vision to extract dialog bubbles, sender addresses, and embedded links.

#### 🌐 THREAT INTELLIGENCE STATUS
- Extracted URLs: None extracted (Vision unconfigured)
- Analysis Engine: Local Configuration Guard

#### ⚡ RECOMMENDED ACTIONS
1. **Copy and paste text**: Copy and paste the message text or URL directly into the chat for instant evaluation.
2. **Configure API key**: Set \`GEMINI_API_KEY\` in your \`.env\` file and restart the server.

#### ⚠️ PROVIDER & TRANSPARENCY NOTICE
⚠️ Multimodal vision evaluation requires \`GEMINI_API_KEY\`. CYBERGUARD does not falsely report unverified images as Low Risk.`;

    return res.json({
      reply: guidanceReport,
      engine: 'guidance_notice',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      requiresGeminiKey: true,
    });
  } catch (err) {
    console.error('Image analysis error:', err.message);
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: `Image analysis failed: ${err.message}`,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. AUDIO / VOICE FRAUD ANALYSIS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/analyze-audio', audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an audio file (WAV, MP3, AAC, M4A, OGG).' });
    }

    const result = analyzeAudioRecording({
      filename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });

    res.json({
      reply: result.formattedReport,
      result,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (err) {
    console.error('Audio analysis error:', err.message);
    res.status(500).json({
      error: 'AUDIO_ANALYSIS_FAILED',
      message: `Audio analysis failed: ${err.message}`,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. URL CHECK ENDPOINT (Google Safe Browsing + Validation)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/check-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid URL string.' });
    }

    // SSRF & Scheme validation
    const validation = isValidWebUrl(url.trim());
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    const { safeBrowsingKey } = getApiKeys();
    const sbResult = await checkSafeBrowsingUrl(validation.url, safeBrowsingKey);

    res.json({
      url: validation.url,
      hostname: validation.hostname,
      safeBrowsing: sbResult,
    });
  } catch (err) {
    console.error('URL check error:', err.message);
    res.status(500).json({
      error: 'URL_CHECK_FAILED',
      message: `URL check failed: ${err.message}`,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. TEST CONNECTIVITY ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/test-gemini', async (req, res) => {
  const { geminiKey } = getApiKeys();
  const testResult = await testGeminiConnection(geminiKey);
  res.json(testResult);
});

app.post('/api/test-safebrowsing', async (req, res) => {
  const { safeBrowsingKey } = getApiKeys();
  if (!isSafeBrowsingConfigured(safeBrowsingKey)) {
    return res.json({
      success: false,
      message: 'Google Safe Browsing API key is not configured or is a placeholder.',
    });
  }

  // Test with standard Google Safe Browsing test malware URL
  const testUrl = 'http://malware.testing.google.test/testing/malware/';
  const result = await checkSafeBrowsingUrl(testUrl, safeBrowsingKey);

  if (result.status === 'threat_detected' || (result.configured && result.status !== 'error')) {
    return res.json({
      success: true,
      message: 'Google Safe Browsing API successfully queried.',
      details: result,
    });
  }

  res.json({
    success: false,
    message: result.summary || 'Failed to query Safe Browsing API.',
    details: result,
  });
});

// Multer and general error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || (err.message && err.message.includes('Unsupported'))) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CYBERGUARD Security Backend running on port ${PORT}`);
});
