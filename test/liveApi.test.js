/**
 * Live End-to-End HTTP API Integration Test
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5001';

async function runApiTests() {
  console.log('\n======================================================');
  console.log('CYBERGUARD LIVE HTTP API ENDPOINT TESTS');
  console.log('======================================================\n');

  // 1. GET /api/status
  console.log('Testing GET /api/status...');
  const statusRes = await fetch(`${BASE_URL}/api/status`);
  assert.strictEqual(statusRes.status, 200);
  const statusData = await statusRes.json();
  console.log('GET /api/status response:', statusData);
  assert.strictEqual(statusData.status, 'ok');

  // 2. POST /api/chat (The user screenshot loan message)
  console.log('\nTesting POST /api/chat with user loan message...');
  const loanMsg = 'Funding ki zarurat hai? INR 50,000 - INR 50 Lakh tak ka paayein Flexible Loan via Tide. Apply now http://u3.mnge.co/TIDEPF/DVprPzY T&C Apply please give me the it real or malicious';
  const chatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: loanMsg }),
  });
  assert.strictEqual(chatRes.status, 200);
  const chatData = await chatRes.json();
  console.log('Engine used:', chatData.engine);
  console.log('Reply preview:\n', chatData.reply.substring(0, 300));
  assert.ok(chatData.reply.includes('HIGH RISK') || chatData.reply.includes('CRITICAL RISK'), 'Loan offer MUST NOT be Low Risk!');
  assert.ok(chatData.reply.includes('Threat Assessment Report'), 'Must contain Threat Assessment Report');
  assert.ok(chatData.analysis.riskScore >= 60, `Risk score must be >= 60, got ${chatData.analysis.riskScore}`);

  // 3. POST /api/analyze-text (Bank phishing with OTP)
  console.log('\nTesting POST /api/analyze-text with bank phishing & OTP...');
  const bankMsg = 'I am from HDFC Bank. Your account has been temporarily blocked. Update details at https://hdfc-secure-login.com/verify. Share your OTP.';
  const analyzeTextRes = await fetch(`${BASE_URL}/api/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: bankMsg }),
  });
  assert.strictEqual(analyzeTextRes.status, 200);
  const textData = await analyzeTextRes.json();
  assert.ok(textData.reply.includes('HIGH RISK') || textData.reply.includes('CRITICAL RISK'));
  assert.strictEqual(textData.analysis.verdict, 'Suspected Bank Phishing and OTP Theft');

  // 4. POST /api/analyze-image with pattern.jpeg (Bank phishing screenshot)
  const patternImgPath = path.resolve(__dirname, '../public/mail message fraud/pattern.jpeg');
  if (fs.existsSync(patternImgPath)) {
    console.log('\nTesting POST /api/analyze-image with pattern.jpeg...');
    const imgBuffer = fs.readFileSync(patternImgPath);
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', blob, 'pattern.jpeg');

    const imgRes = await fetch(`${BASE_URL}/api/analyze-image`, {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(imgRes.status, 200);
    const imgData = await imgRes.json();
    console.log('Image analysis engine:', imgData.engine);
    console.log('Image reply preview:\n', imgData.reply.substring(0, 350));
    assert.ok(imgData.reply.includes('Threat Assessment Report'));
    assert.ok(imgData.reply.includes('HIGH RISK') || imgData.reply.includes('CRITICAL RISK'));
  }

  // 5. POST /api/analyze-image with pattern2.jpeg (Reward scam screenshot)
  const pattern2ImgPath = path.resolve(__dirname, '../public/mail message fraud/pattern2.jpeg');
  if (fs.existsSync(pattern2ImgPath)) {
    console.log('\nTesting POST /api/analyze-image with pattern2.jpeg...');
    const imgBuffer = fs.readFileSync(pattern2ImgPath);
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', blob, 'pattern2.jpeg');

    const imgRes = await fetch(`${BASE_URL}/api/analyze-image`, {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(imgRes.status, 200);
    const imgData = await imgRes.json();
    console.log('Image analysis engine:', imgData.engine);
    console.log('Image reply preview:\n', imgData.reply.substring(0, 350));
    assert.ok(imgData.reply.includes('Threat Assessment Report'));
    assert.ok(imgData.reply.includes('HIGH RISK') || imgData.reply.includes('CRITICAL RISK'));
  }

  // 6. Test unsupported upload error handling (400 Bad Request)
  console.log('\nTesting upload with unsupported file...');
  const dummyBlob = new Blob(['hello world'], { type: 'text/plain' });
  const badFormData = new FormData();
  badFormData.append('image', dummyBlob, 'test.txt');
  const badUploadRes = await fetch(`${BASE_URL}/api/analyze-image`, {
    method: 'POST',
    body: badFormData,
  });
  assert.strictEqual(badUploadRes.status, 400);
  const badUploadData = await badUploadRes.json();
  console.log('Unsupported upload correctly rejected with 400:', badUploadData);

  console.log('\n======================================================');
  console.log('ALL LIVE HTTP API TESTS COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runApiTests().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
