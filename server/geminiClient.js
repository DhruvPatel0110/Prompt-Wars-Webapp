/**
 * Resilient Google Gemini AI Client with Rate-Limit Pacing & Auto-Fallback
 * Smoothly handles free-tier rate limits (5 RPM / 15 RPM) with backoff, queue throttling, and model fallback.
 */

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

// Global request pacer to prevent bursting Gemini free tier
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1200;

async function throttleRequest() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
    await new Promise(r => setTimeout(r, waitTime));
  }
  lastRequestTime = Date.now();
}

function parseRetryDelay(errText, defaultSecs = 3) {
  try {
    const json = JSON.parse(errText);
    const retryInfo = json.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
    if (retryInfo?.retryDelay) {
      const match = retryInfo.retryDelay.match(/(\d+(\.\d+)?)s/);
      if (match) return Math.min(8, Math.max(1, parseFloat(match[1])));
    }
  } catch {
    // Non-JSON response
  }
  const match = errText.match(/retry in\s+([0-9.]+)\s*s/i);
  if (match) return Math.min(8, Math.max(1, parseFloat(match[1])));
  return defaultSecs;
}

export async function generateGeminiContent({ prompt, jsonMode = true, temperature = 0.2 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await throttleRequest();

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature
          }
        };

        if (jsonMode) {
          payload.generationConfig.responseMimeType = "application/json";
        }

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          
          if (response.status === 404 || errText.includes("not found")) {
            lastError = new Error(`Model ${model} not available in API key tier`);
            break; // Try next model immediately
          }

          if (response.status === 429 || response.status === 503) {
            const delaySec = parseRetryDelay(errText, 3.5);
            if (attempt === 0) {
              console.log(`[GeminiClient] ${model} rate-limited (HTTP ${response.status}). Waiting ${delaySec}s before retry...`);
              await new Promise(r => setTimeout(r, delaySec * 1000));
              continue; // Retry once
            } else {
              console.warn(`[GeminiClient] ${model} rate limit persistent (HTTP ${response.status}). Trying next fallback model.`);
              lastError = new Error(`Gemini ${model} rate limited (HTTP ${response.status})`);
              break; // Try next model
            }
          }

          throw new Error(`Gemini ${model} HTTP ${response.status}: ${errText.slice(0, 150)}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error(`Empty response received from Gemini ${model}`);
        }

        if (jsonMode) {
          let clean = rawText.trim();
          if (clean.startsWith('```')) {
            clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
          }
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          return JSON.parse(jsonMatch ? jsonMatch[0] : clean);
        }

        return rawText;
      } catch (err) {
        lastError = err;
        if (err.message && (err.message.includes("rate limited") || err.message.includes("not available"))) {
          break;
        }
        if (attempt === 1) {
          console.warn(`[GeminiClient] Model ${model} failed: ${err.message}`);
        }
      }
    }
  }

  throw lastError || new Error("All Gemini candidate models failed");
}
