import { generateGeminiContent } from './geminiClient.js';

/**
 * Evaluates a student's reverse-engineered image prompt against their assigned competition image challenge.
 * Total points: 20 across 4 standard criteria (Composition 5, Colors 5, Subject 5, Style 5).
 * Provider priority: Groq (free tier) → Anthropic → Gemini → Heuristics
 */
export async function evaluateRound2Prompt({ assignedChallenge, studentPrompt, teamName }) {
  const challenge = assignedChallenge || {
    title: "Competition Visual Asset",
    description: "High-detail digital artwork",
    keyElements: ["Composition", "Lighting", "Subject", "Render Style"],
    targetVisualPrompt: "Photorealistic 8k render with cinematic lighting"
  };

  // 1. Groq (free tier - fastest)
  if (process.env.GROQ_API_KEY) {
    try {
      return await evaluateImageWithGroq({ targetImage: challenge, studentPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator] Groq API failed (${err.message}). Trying Anthropic.`);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateImageWithAnthropic({ targetImage: challenge, studentPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator] Anthropic API failed (${err.message}). Trying Gemini.`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateImageWithGemini({ targetImage: challenge, studentPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator] Gemini API failed (${err.message}). Falling back to heuristics.`);
    }
  }

  return evaluateImageWithHeuristics({ targetImage: challenge, studentPrompt });
}


// Backward-compatible alias
export async function evaluateRound2Challenge1({ targetImage, studentPrompt, teamName }) {
  return evaluateRound2Prompt({ assignedChallenge: targetImage, studentPrompt, teamName });
}

export async function evaluateRound2Challenge2({ targetReport, studentPrompt, teamName }) {
  return evaluateRound2Prompt({ assignedChallenge: targetReport, studentPrompt, teamName });
}

// --- Groq Image Evaluator (Primary - Free Tier with resilient model fallback) ---
async function evaluateImageWithGroq({ targetImage, studentPrompt }) {
  const prompt = `You are an authoritative AI judge for PROMPT WARS Round 2: Prompt Reverse Engineering.
A student team was shown a specific target image and tasked with writing a prompt that would regenerate and recreate that exact visual output.

TARGET IMAGE DETAILS:
- Title: ${targetImage.title}
- Description: ${targetImage.description}
- Key Visual Elements: ${JSON.stringify(targetImage.keyElements || [])}
- Reference Prompt (for context): "${targetImage.targetVisualPrompt || ''}"

STUDENT'S REVERSE-ENGINEERED PROMPT:
"${studentPrompt}"

SCORING PHILOSOPHY & OBJECTIVE:
- The objective is VISUAL FIDELITY and finding the CLOSEST CONCEPTUAL RECREATION MATCH to the target image (NOT exact verbatim word matching).
- Students only saw the image, not the hidden prompt. Reward them for accurately dissecting and describing what is visually present (camera angle, lighting, colors, subjects, textures, render engine style) even when they use synonyms or creative prompt terminology.
- High scores (14-19/20): Prompts that would successfully generate a visual output closely resembling the target artwork.
- Moderate scores (8-13/20): Prompts that capture the core subject but miss specific lighting cues, camera lens perspective, or secondary environment details.
- Low scores (1-7/20): Vague, generic prompts with little to no detail.

EVALUATE ON 4 CORE PILLARS (Total 20 pts):
1. composition_score (0-5): Camera angle, perspective (e.g. low-angle, aerial, eye-level), framing, depth of field, aspect ratio.
2. colors_score (0-5): Color palette accuracy, lighting sources, shadows, ambient glow, atmospheric reflections.
3. subject_score (0-5): Primary subjects, characters/objects, environment accuracy, architecture and key details.
4. style_score (0-5): Art style, rendering medium cues (e.g. Octane, Unreal Engine 5, 8k, digital concept art, cinematic photograph).

Respond ONLY with valid JSON (no markdown):
{"composition_score":<number 0-5>,"colors_score":<number 0-5>,"subject_score":<number 0-5>,"style_score":<number 0-5>,"total_score":<number 0-20>,"reasoning":"<constructive feedback highlighting closest matches and missed visual nuances>","matched_elements":["<element 1>","<element 2>"],"missed_elements":["<element 1>"]}`;

  const candidateModels = ["groq/compound-mini", "groq/compound", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 1200,
          messages: [
            { role: "system", content: "You are an expert AI art and prompt judge. Output valid JSON only." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq model ${model} HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const res = JSON.parse(content);

      const composition = Math.min(5, Math.max(0, Number(res.composition_score) || 0));
      const colors = Math.min(5, Math.max(0, Number(res.colors_score) || 0));
      const subject = Math.min(5, Math.max(0, Number(res.subject_score) || 0));
      const style = Math.min(5, Math.max(0, Number(res.style_score) || 0));
      const total = composition + colors + subject + style;

      return {
        composition_score: composition,
        colors_score: colors,
        subject_score: subject,
        style_score: style,
        total_score: total,
        reasoning: res.reasoning || `Scored ${total}/20 across composition, colors, subject, and style.`,
        matched_elements: Array.isArray(res.matched_elements) ? res.matched_elements : ["Target visual alignment"],
        missed_elements: Array.isArray(res.missed_elements) ? res.missed_elements : ["Specific lighting or lens parameters"]
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Round2 Evaluator] Groq model ${model} failed (${err.message}), trying next candidate...`);
    }
  }

  throw lastError || new Error("All Groq candidate models failed.");
}


// --- Anthropic Image Evaluator ---
async function evaluateImageWithAnthropic({ targetImage, studentPrompt }) {
  const prompt = `You are an authoritative AI judge for PROMPT WARS Round 2: Prompt Reverse Engineering.
A student team was shown a specific target image and tasked with writing a prompt that would regenerate/recreate that exact visual output.

TARGET IMAGE DETAILS:
- Title: ${targetImage.title}
- Description: ${targetImage.description}
- Key Visual Elements: ${JSON.stringify(targetImage.keyElements || [])}
- Reference Prompt: "${targetImage.targetVisualPrompt || ''}"

STUDENT'S REVERSE-ENGINEERED PROMPT:
"${studentPrompt}"

Evaluate how accurately this student prompt captures the target image across 4 criteria (Total 20 pts):
1. composition_score (0.0 to 5.0): Camera angle, framing, depth of field, perspective, aspect ratio.
2. colors_score (0.0 to 5.0): Color palette accuracy, lighting sources, shadows, ambient glow, atmospheric reflections.
3. subject_score (0.0 to 5.0): Primary subjects, secondary details, environment accuracy, architecture/textures.
4. style_score (0.0 to 5.0): Art style, render engine tokens (Octane, Unreal, Studio photo, 8k, lens focal length), medium fidelity.

Respond ONLY with valid JSON in this exact schema:
{
  "composition_score": <number 0-5>,
  "colors_score": <number 0-5>,
  "subject_score": <number 0-5>,
  "style_score": <number 0-5>,
  "total_score": <number 0-20>,
  "reasoning": "<string constructive feedback on prompt accuracy and fidelity>",
  "matched_elements": ["<string>", "<string>"],
  "missed_elements": ["<string>"]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);
  const data = await response.json();
  const rawText = data.content?.[0]?.text || "{}";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  return sanitizeEvaluationResult(parsed);
}

// --- Gemini Image Evaluator ---
async function evaluateImageWithGemini({ targetImage, studentPrompt }) {
  const prompt = `You are an authoritative AI judge for PROMPT WARS Round 2: Prompt Reverse Engineering.
A student team was shown a specific target competition image and tasked with writing a prompt to recreate it.

TARGET IMAGE DETAILS:
- Title: ${targetImage.title}
- Description: ${targetImage.description}
- Key Visual Elements: ${JSON.stringify(targetImage.keyElements || [])}
- Reference Prompt: "${targetImage.targetVisualPrompt || ''}"

STUDENT'S PROMPT:
"${studentPrompt}"

Score the prompt strictly from 0.0 to 5.0 on each of the 4 criteria:
1. composition_score (0-5): Camera angle, perspective, framing, depth of field.
2. colors_score (0-5): Lighting atmosphere, color palette, highlights, contrast.
3. subject_score (0-5): Primary objects, characters, environment, details.
4. style_score (0-5): Rendering engine keywords, photography specs, texture fidelity.

Provide JSON output with:
{
  "composition_score": 0.0,
  "colors_score": 0.0,
  "subject_score": 0.0,
  "style_score": 0.0,
  "total_score": 0.0,
  "reasoning": "Feedback",
  "matched_elements": ["element 1", "element 2"],
  "missed_elements": ["missing 1"]
}`;

  const result = await generateGeminiContent({ prompt, jsonMode: true, temperature: 0.2 });
  return sanitizeEvaluationResult(result);
}

function sanitizeEvaluationResult(res) {
  const comp = Math.min(5, Math.max(0, Number(res.composition_score || res.composition) || 3));
  const colors = Math.min(5, Math.max(0, Number(res.colors_score || res.colors) || 3));
  const subj = Math.min(5, Math.max(0, Number(res.subject_score || res.subject) || 3));
  const style = Math.min(5, Math.max(0, Number(res.style_score || res.style) || 3));
  const total = Number((comp + colors + subj + style).toFixed(1));

  return {
    composition_score: comp,
    colors_score: colors,
    subject_score: subj,
    style_score: style,
    total_score: total,
    reasoning: res.reasoning || `Reverse engineering accuracy: ${total}/20. Solid visual breakdown.`,
    matched_elements: Array.isArray(res.matched_elements) && res.matched_elements.length ? res.matched_elements : ["Accurate general subject and theme"],
    missed_elements: Array.isArray(res.missed_elements) && res.missed_elements.length ? res.missed_elements : ["Could add camera lens parameters and lighting nuances"]
  };
}

// --- Heuristic Fallback Evaluator ---
export function evaluateImageWithHeuristics({ targetImage, studentPrompt }) {
  const text = (studentPrompt || "").trim();
  const lower = text.toLowerCase();
  const charCount = text.length;

  let compScore = 1.5;
  let colorsScore = 1.5;
  let subjScore = 1.5;
  let styleScore = 1.5;
  const matched = [];
  const missed = [];

  // 1. Composition cues
  if (/(wide angle|panoramic|cinematic|perspective|macro|close up|aerial|top down|centered|depth of field|bokeh|aspect ratio|16:9|1:1|symmetry|low angle|eye level|telephoto)/i.test(text)) {
    compScore += 2.0;
    matched.push("Camera perspective & framing cues specified");
  } else {
    missed.push("Specify camera angle (e.g. low-angle, wide-shot, macro)");
  }
  if (charCount > 100) compScore += 0.8;
  if (charCount > 200) compScore += 0.7;

  // 2. Colors & Lighting
  if (/(sunset|golden hour|neon|glow|lighting|volumetric|shadows|ambient|reflections|cyan|emerald|gold|obsidian|warm|cool|rim light|god rays|aurora|daylight|dusk|candlelight)/i.test(text)) {
    colorsScore += 2.0;
    matched.push("Atmospheric lighting & color palette identified");
  } else {
    missed.push("Add specific lighting conditions (e.g. volumetric god-rays, neon glow)");
  }
  if (charCount > 120) colorsScore += 0.8;
  if (charCount > 220) colorsScore += 0.7;

  // 3. Subject & Environment keywords
  const challengeText = `${targetImage.title || ''} ${targetImage.description || ''} ${(targetImage.keyElements || []).join(' ')}`.toLowerCase();
  const keyWords = challengeText.split(/\W+/).filter(w => w.length > 4);
  const matchedKeywords = keyWords.filter(kw => lower.includes(kw));
  
  if (matchedKeywords.length >= 5) {
    subjScore += 2.5;
    matched.push(`Matched key visual elements (${matchedKeywords.slice(0, 3).join(', ')})`);
  } else if (matchedKeywords.length >= 2) {
    subjScore += 1.8;
    matched.push("Referenced primary subject matter");
  } else {
    subjScore += 1.0;
    missed.push("Include more granular physical scene objects and environment details");
  }
  if (charCount > 160) subjScore += 0.5;

  // 4. Style & Rendering parameters
  if (/(unreal engine|octane render|photorealistic|hyperrealistic|8k|4k|ray tracing|masterpiece|studio photography|lens|dslr|rendering|vogue|hasselblad|artstation|matte painting)/i.test(text)) {
    styleScore += 2.5;
    matched.push("High-fidelity artistic rendering & medium tokens included");
  } else {
    styleScore += 1.0;
    missed.push("Add rendering engine parameters or photographic lens specifications");
  }
  if (charCount > 140) styleScore += 0.5;

  compScore = Math.min(5, Math.max(1, Number(compScore.toFixed(1))));
  colorsScore = Math.min(5, Math.max(1, Number(colorsScore.toFixed(1))));
  subjScore = Math.min(5, Math.max(1, Number(subjScore.toFixed(1))));
  styleScore = Math.min(5, Math.max(1, Number(styleScore.toFixed(1))));

  const totalScore = Number((compScore + colorsScore + subjScore + styleScore).toFixed(1));

  return {
    composition_score: compScore,
    colors_score: colorsScore,
    subject_score: subjScore,
    style_score: styleScore,
    total_score: totalScore,
    reasoning: `Reverse engineering accuracy: ${totalScore}/20. ${
      totalScore >= 16
        ? "Exemplary visual dissection! Masterfully captured composition, lighting, and rendering style."
        : totalScore >= 12
        ? "Solid prompt reverse-engineering with good subject and color recognition."
        : "Basic recreation. Enhance camera perspective, lighting nuance, and render style cues."
    }`,
    matched_elements: matched.length ? matched : ["General subject identified"],
    missed_elements: missed.length ? missed : ["Fine stylistic parameters and lens metadata"]
  };
}
