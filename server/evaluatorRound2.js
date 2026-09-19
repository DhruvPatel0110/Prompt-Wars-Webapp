import { generateGeminiContent } from './geminiClient.js';

/**
 * AI Evaluator Engine for PROMPT WARS Round 2: Prompt Reverse Engineering
 * Total Points: 20 across 4 standard criteria:
 *   1. Composition & Framing (0-5 pts)
 *   2. Colors & Lighting Atmosphere (0-5 pts)
 *   3. Subject & Key Visual Elements (0-5 pts)
 *   4. Style, Medium & Render Engine Tokens (0-5 pts)
 * 
 * Provider priority: Groq (free tier) → Gemini → OpenAI → Anthropic → Heuristics
 */
export async function evaluateRound2Prompt({ assignedChallenge, studentPrompt, teamName }) {
  const challenge = assignedChallenge || {
    title: "Competition Visual Asset",
    description: "High-detail digital artwork",
    keyElements: ["Composition", "Lighting", "Subject", "Render Style"],
    targetVisualPrompt: "Photorealistic 8k render with cinematic lighting",
    evaluationCriteria: {
      composition: "Camera framing and perspective",
      colors: "Color palette and lighting",
      subject: "Primary subject and environment",
      style: "Artistic medium and render quality"
    }
  };

  const cleanPrompt = (studentPrompt || "").trim();

  // 1. Strict Zero-Score for Empty / Null / Placeholder Prompts
  if (!cleanPrompt || 
      cleanPrompt.length < 10 || 
      /^no prompt submitted/i.test(cleanPrompt) ||
      cleanPrompt.toLowerCase() === "high detail render of target competition asset") {
    return {
      composition_score: 0,
      colors_score: 0,
      subject_score: 0,
      style_score: 0,
      total_score: 0,
      reasoning: "No valid reverse-engineered prompt submitted (0/20). To score points, describe the target image's camera perspective, color palette, main subjects, and rendering style.",
      matched_elements: [],
      missed_elements: [
        "Camera composition & perspective missing",
        "Color palette & lighting atmosphere missing",
        "Subject & visual details missing",
        "Art style & render parameters missing"
      ]
    };
  }

  // 2. Groq LLM (free tier - fastest, generous rate limits)
  if (process.env.GROQ_API_KEY) {
    try {
      return await evaluateImageWithGroq({ targetImage: challenge, studentPrompt: cleanPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator] Groq API failed (${err.message}). Trying Gemini.`);
    }
  }

  // 3. Google Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateImageWithGemini({ targetImage: challenge, studentPrompt: cleanPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator] Gemini API failed (${err.message}). Trying OpenAI.`);
    }
  }

  // 4. OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      return await evaluateImageWithOpenAI({ targetImage: challenge, studentPrompt: cleanPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator] OpenAI API failed (${err.message}). Trying Anthropic.`);
    }
  }

  // 5. Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateImageWithAnthropic({ targetImage: challenge, studentPrompt: cleanPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator] Anthropic API failed (${err.message}). Falling back to heuristics.`);
    }
  }

  // 6. Sophisticated Semantic Similarity & Rubric Engine (Fallback)
  return evaluateImageWithHeuristics({ targetImage: challenge, studentPrompt: cleanPrompt });
}

// Backward-compatible aliases
export async function evaluateRound2Challenge1({ targetImage, studentPrompt, teamName }) {
  return evaluateRound2Prompt({ assignedChallenge: targetImage, studentPrompt, teamName });
}

export async function evaluateRound2Challenge2({ targetReport, studentPrompt, teamName }) {
  return evaluateRound2Prompt({ assignedChallenge: targetReport, studentPrompt, teamName });
}

<<<<<<< HEAD
// --- Groq Image Evaluator (Primary - Free Tier with resilient model fallback) ---
async function evaluateImageWithGroq({ targetImage, studentPrompt }) {
  const prompt = `You are an authoritative AI judge for PROMPT WARS Round 2: Prompt Reverse Engineering.
A student team was shown a specific target image and tasked with writing a prompt that would regenerate and recreate that exact visual output.
=======
>>>>>>> 8aeb21002d1ecb73f587e4ea4fd3b400f6e48fd3

// ============================================================================
// LLM PROMPT BUILDER
// ============================================================================
function buildRound2EvalPrompt({ targetImage, studentPrompt }) {
  return `You are the Official AI Adjudicator for PROMPT WARS Round 2: Prompt Reverse Engineering.
In this competition round, a student team was shown a specific target image and had to write a prompt to regenerate/recreate that exact visual output using an AI image generator (e.g. Midjourney v6, SDXL, DALL-E 3).

TARGET IMAGE SPECIFICATIONS:
- Title: "${targetImage.title || 'Competition Asset'}"
- Visual Description: "${targetImage.description || ''}"
- Key Visual Elements: ${JSON.stringify(targetImage.keyElements || [])}
<<<<<<< HEAD
- Reference Prompt (for context): "${targetImage.targetVisualPrompt || ''}"
=======
- Reference Creation Prompt: "${targetImage.targetVisualPrompt || ''}"
- Evaluation Rubric Focus: ${JSON.stringify(targetImage.evaluationCriteria || {})}
>>>>>>> 8aeb21002d1ecb73f587e4ea4fd3b400f6e48fd3

STUDENT'S REVERSE-ENGINEERED PROMPT:
"""${studentPrompt}"""

<<<<<<< HEAD
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
=======
EVALUATION PRINCIPLE (Strict Visual Similarity):
Evaluate how closely an image generated from the student's prompt would match the target image across 4 criteria (Total 20 Points):

1. composition_score (0.0 to 5.0 pts):
   - Camera angle / perspective (e.g. low-angle, wide panoramic, macro close-up, top-down, centered, eye-level).
   - Framing, spatial depth, foreground/background layering, aspect ratio.
>>>>>>> 8aeb21002d1ecb73f587e4ea4fd3b400f6e48fd3

2. colors_score (0.0 to 5.0 pts):
   - Color palette fidelity matching target image (e.g. neon pink/cyan/purple vs golden sunset vs monochrome obsidian).
   - Lighting physics (volumetric rain reflections, god rays, rim lighting, specular highlights, ambient shadows).

3. subject_score (0.0 to 5.0 pts):
   - Accurate identification of primary subject(s), characters, focal objects.
   - Accuracy of secondary environment details, materials, textures, and key props listed in the target.
   - If the student describes something completely unrelated (e.g. food for a sci-fi city), score 0-1.

4. style_score (0.0 to 5.0 pts):
   - Art medium (digital concept art, matte painting, 3D render, studio photography, anime, cinematic film still).
   - Rendering engine & lens parameters (Unreal Engine 5, Octane render, ray tracing, 8k, lens focal length, photorealism).

SCORING CALIBRATION:
- 0.0 - 1.0: Off-topic, gibberish, or generic 1-liner with no similarity to the image.
- 1.5 - 2.5: Weak recreation. Mentions a vague concept but misses specific subjects, colors, and camera angle.
- 3.0 - 4.0: Good recreation. Captures the main subject, general colors, and style well.
- 4.5 - 5.0: Masterful reverse-engineering. High-fidelity match for perspective, color palette, fine details, and render cues.

Respond ONLY with valid JSON matching this exact schema (no markdown, no code blocks):
{"composition_score":<number 0-5>,"colors_score":<number 0-5>,"subject_score":<number 0-5>,"style_score":<number 0-5>,"total_score":<number 0-20>,"reasoning":"<detailed feedback on what matched and what was missed>","matched_elements":["<matched detail 1>","<matched detail 2>"],"missed_elements":["<missed detail 1>","<missed detail 2>"]}`;
}


// ============================================================================
// GROQ EVALUATOR (Free Tier)
// ============================================================================
async function evaluateImageWithGroq({ targetImage, studentPrompt }) {
  const prompt = buildRound2EvalPrompt({ targetImage, studentPrompt });
  const candidateModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "groq/compound-mini"];
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
          temperature: 0.1,
          max_tokens: 1200,
          messages: [
            { role: "system", content: "You are an expert AI image prompt adjudicator. Return valid JSON only." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const res = JSON.parse(content);
      return sanitizeEvaluationResult(res);
    } catch (err) {
      lastError = err;
      console.warn(`[Round2 Evaluator] Groq model ${model} failed (${err.message}), trying next candidate...`);
    }
  }

  throw lastError || new Error("All Groq models failed.");
}


// ============================================================================
// GEMINI EVALUATOR
// ============================================================================
async function evaluateImageWithGemini({ targetImage, studentPrompt }) {
  const prompt = buildRound2EvalPrompt({ targetImage, studentPrompt });
  const result = await generateGeminiContent({ prompt, jsonMode: true, temperature: 0.1 });
  return sanitizeEvaluationResult(result);
}


// ============================================================================
// OPENAI EVALUATOR
// ============================================================================
async function evaluateImageWithOpenAI({ targetImage, studentPrompt }) {
  const prompt = buildRound2EvalPrompt({ targetImage, studentPrompt });
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: "system", content: "You are an authoritative AI art and prompt judge. Output valid JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const res = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  return sanitizeEvaluationResult(res);
}


// ============================================================================
// ANTHROPIC EVALUATOR
// ============================================================================
async function evaluateImageWithAnthropic({ targetImage, studentPrompt }) {
  const prompt = buildRound2EvalPrompt({ targetImage, studentPrompt });
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const rawText = data.content?.[0]?.text || "{}";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  return sanitizeEvaluationResult(parsed);
}


// ============================================================================
// SANITIZE & VALIDATE RESULT
// ============================================================================
function sanitizeEvaluationResult(res) {
  const comp = Math.min(5, Math.max(0, Number(res.composition_score ?? res.composition ?? 0)));
  const colors = Math.min(5, Math.max(0, Number(res.colors_score ?? res.colors ?? 0)));
  const subj = Math.min(5, Math.max(0, Number(res.subject_score ?? res.subject ?? 0)));
  const style = Math.min(5, Math.max(0, Number(res.style_score ?? res.style ?? 0)));
  const total = Number((comp + colors + subj + style).toFixed(1));

  return {
    composition_score: Number(comp.toFixed(1)),
    colors_score: Number(colors.toFixed(1)),
    subject_score: Number(subj.toFixed(1)),
    style_score: Number(style.toFixed(1)),
    total_score: total,
    reasoning: res.reasoning || `Reverse engineering accuracy: ${total}/20 across composition, colors, subject, and style.`,
    matched_elements: Array.isArray(res.matched_elements) && res.matched_elements.length ? res.matched_elements : ["Target visual alignment"],
    missed_elements: Array.isArray(res.missed_elements) && res.missed_elements.length ? res.missed_elements : ["Fine stylistic parameters and lens metadata"]
  };
}


// ============================================================================
// DETERMINISTIC SEMANTIC SIMILARITY & RUBRIC ENGINE (Heuristics Fallback)
// ============================================================================
export function evaluateImageWithHeuristics({ targetImage, studentPrompt }) {
  const text = (studentPrompt || "").trim();
  const lower = text.toLowerCase();
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // 0. Null / Empty / Trivial prompt check
  if (!text || charCount < 10 || /^no prompt submitted/i.test(text)) {
    return {
      composition_score: 0,
      colors_score: 0,
      subject_score: 0,
      style_score: 0,
      total_score: 0,
      reasoning: "No valid prompt submitted (0/20). Reverse engineering requires describing the target image.",
      matched_elements: [],
      missed_elements: ["All visual elements missing"]
    };
  }

  const matched = [];
  const missed = [];

  // --------------------------------------------------------------------------
  // Target Image Knowledge Extraction
  // --------------------------------------------------------------------------
  const targetTitle = (targetImage.title || "").toLowerCase();
  const targetDesc = (targetImage.description || "").toLowerCase();
  const targetKeyElements = (targetImage.keyElements || []).map(e => e.toLowerCase());
  const targetRefPrompt = (targetImage.targetVisualPrompt || "").toLowerCase();
  const targetCriteria = targetImage.evaluationCriteria || {};

  const fullTargetContext = `${targetTitle} ${targetDesc} ${targetKeyElements.join(' ')} ${targetRefPrompt}`.toLowerCase();

  // Extract meaningful semantic keywords (length > 3, exclude common stop words)
  const stopWords = new Set(["with", "from", "that", "this", "have", "were", "what", "when", "where", "which", "about", "into", "over", "after", "through", "during", "before", "under", "around", "their", "there", "image", "prompt", "picture", "photo", "render"]);
  const targetWords = Array.from(new Set(
    fullTargetContext.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w))
  ));

  // --------------------------------------------------------------------------
  // 1. SUBJECT & SCENE FIDELITY (0.0 to 5.0)
  // --------------------------------------------------------------------------
  let subjScore = 0;
  const matchedTargetWords = targetWords.filter(w => lower.includes(w));
  const keywordMatchRatio = targetWords.length > 0 ? (matchedTargetWords.length / targetWords.length) : 0;

  // Check key elements coverage
  let keyElementsMatchedCount = 0;
  targetKeyElements.forEach(el => {
    const elWords = el.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
    const matchedCount = elWords.filter(w => lower.includes(w)).length;
    if (matchedCount >= Math.min(2, elWords.length)) {
      keyElementsMatchedCount++;
    }
  });

  if (matchedTargetWords.length >= 8 || keyElementsMatchedCount >= 3) {
    subjScore = 4.5 + (keywordMatchRatio > 0.4 ? 0.5 : 0);
    matched.push(`Accurately identified primary subjects & environment (${matchedTargetWords.slice(0, 4).join(', ')})`);
  } else if (matchedTargetWords.length >= 5 || keyElementsMatchedCount >= 2) {
    subjScore = 3.5 + Math.min(0.8, matchedTargetWords.length * 0.1);
    matched.push(`Captured key visual subjects (${matchedTargetWords.slice(0, 3).join(', ')})`);
  } else if (matchedTargetWords.length >= 2 || keyElementsMatchedCount >= 1) {
    subjScore = 2.0 + (matchedTargetWords.length * 0.3);
    matched.push(`Partially identified main subject matter (${matchedTargetWords.slice(0, 2).join(', ')})`);
    missed.push("Describe more granular physical objects, character props, and environment textures");
  } else if (matchedTargetWords.length === 1) {
    subjScore = 1.0;
    matched.push(`Mentioned core concept: ${matchedTargetWords[0]}`);
    missed.push("Missing primary subject details and scene context");
  } else {
    // 0 keywords matched = off-topic prompt
    subjScore = 0.0;
    missed.push("Prompt subject does not match the assigned target image");
  }

  // --------------------------------------------------------------------------
  // 2. COLORS & LIGHTING ATMOSPHERE (0.0 to 5.0)
  // --------------------------------------------------------------------------
  let colorsScore = 0;
  const colorVocabulary = [
    "neon", "pink", "cyan", "purple", "magenta", "turquoise", "crimson", "sapphire", "emerald",
    "golden", "amber", "sunset", "orange", "gold", "warm", "cool", "obsidian", "pastel", "metallic",
    "monochrome", "vibrant", "saturated", "palette", "hue", "tones", "noir", "dark", "glowing", "iridescent", "silver", "ivory"
  ];
  const lightingVocabulary = [
    "lighting", "reflections", "volumetric", "god rays", "sunburst", "sunlight", "rim light",
    "backlit", "ambient", "shadows", "glow", "steam", "rain-drenched", "wet asphalt", "specular",
    "lens flare", "cinematic lighting", "studio lighting", "softbox", "diffused", "bioluminescent",
    "raytraced", "illuminated", "neon signs", "candlelight", "dusk", "golden hour", "high contrast"
  ];

  const matchedColors = colorVocabulary.filter(c => lower.includes(c));
  const matchedLighting = lightingVocabulary.filter(l => lower.includes(l));

  // Check if student matched specific colors/lighting relevant to THIS target
  const targetHasColors = colorVocabulary.filter(c => fullTargetContext.includes(c));
  const targetHasLighting = lightingVocabulary.filter(l => fullTargetContext.includes(l));

  const relevantColorMatches = matchedColors.filter(c => targetHasColors.includes(c));
  const relevantLightingMatches = matchedLighting.filter(l => targetHasLighting.includes(l));

  if (relevantColorMatches.length >= 2 && relevantLightingMatches.length >= 2) {
    colorsScore = 4.5 + (relevantColorMatches.length + relevantLightingMatches.length > 5 ? 0.5 : 0);
    matched.push(`Spot-on color palette & lighting (${relevantColorMatches.join(', ')}, ${relevantLightingMatches.slice(0, 2).join(', ')})`);
  } else if (relevantColorMatches.length >= 1 && relevantLightingMatches.length >= 1) {
    colorsScore = 3.5;
    matched.push(`Good lighting atmosphere identified (${relevantLightingMatches[0]} with ${relevantColorMatches[0]} tones)`);
  } else if (matchedColors.length > 0 || matchedLighting.length > 0) {
    colorsScore = 2.0;
    matched.push("Specified general color/lighting terms");
    missed.push("Align specific lighting source (e.g. volumetric neon reflections vs golden hour sunbeams)");
  } else {
    colorsScore = 0.0;
    missed.push("No specific color palette or lighting atmosphere described");
  }

  // --------------------------------------------------------------------------
  // 3. COMPOSITION & FRAMING (0.0 to 5.0)
  // --------------------------------------------------------------------------
  let compScore = 0;
  const compositionTerms = [
    { pattern: /(low[- ]angle|worm'?s[- ]eye|ground[- ]level|looking up)/i, type: "low angle" },
    { pattern: /(wide[- ]angle|panoramic|ultra[- ]wide|vista|landscape vista|wide[- ]shot)/i, type: "wide angle" },
    { pattern: /(macro|extreme close[- ]up|close[- ]up|tight shot|shallow depth of field|bokeh|focal point)/i, type: "macro / close-up" },
    { pattern: /(aerial|top[- ]down|bird'?s[- ]eye|drone view|overhead)/i, type: "aerial / top-down" },
    { pattern: /(centered|symmetrical|symmetry|rule of thirds|portrait orientation|vertical framing)/i, type: "framing / layout" },
    { pattern: /(cinematic framing|cinematic|anamorphic|depth of field|foreground|background|layering|perspective)/i, type: "cinematic perspective" },
    { pattern: /(16:9|9:16|1:1|21:9|aspect ratio)/i, type: "aspect ratio" }
  ];

  const matchedCompTypes = [];
  compositionTerms.forEach(ct => {
    if (ct.pattern.test(text)) {
      matchedCompTypes.push(ct.type);
    }
  });

  // Check if student's composition matches target's actual composition
  const targetCompText = `${targetCriteria.composition || ''} ${targetDesc} ${targetRefPrompt}`.toLowerCase();
  const targetIsLowAngle = /low[- ]angle|ground[- ]level|looking up/i.test(targetCompText);
  const targetIsWide = /wide[- ]angle|panoramic|vista|wide[- ]shot/i.test(targetCompText);
  const targetIsMacro = /macro|close[- ]up|tight/i.test(targetCompText);
  const targetIsAerial = /aerial|top[- ]down|bird/i.test(targetCompText);

  const studentHasLowAngle = /(low[- ]angle|worm'?s[- ]eye|ground[- ]level)/i.test(text);
  const studentHasWide = /(wide[- ]angle|panoramic|vista|wide[- ]shot)/i.test(text);
  const studentHasMacro = /(macro|close[- ]up|shallow depth of field|bokeh)/i.test(text);
  const studentHasAerial = /(aerial|top[- ]down|bird'?s[- ]eye)/i.test(text);

  let exactPerspectiveMatched = false;
  if (targetIsLowAngle && studentHasLowAngle) exactPerspectiveMatched = true;
  if (targetIsWide && studentHasWide) exactPerspectiveMatched = true;
  if (targetIsMacro && studentHasMacro) exactPerspectiveMatched = true;
  if (targetIsAerial && studentHasAerial) exactPerspectiveMatched = true;

  if (exactPerspectiveMatched && matchedCompTypes.length >= 2) {
    compScore = 4.8;
    matched.push(`Accurate camera angle & framing perspective (${matchedCompTypes.join(', ')})`);
  } else if (exactPerspectiveMatched) {
    compScore = 3.8;
    matched.push("Correct camera perspective identified");
  } else if (matchedCompTypes.length >= 2) {
    compScore = 2.8;
    matched.push(`Specified spatial composition cues (${matchedCompTypes.join(', ')})`);
    missed.push("Calibrate exact camera angle (e.g. low-angle vs wide panoramic vs macro)");
  } else if (matchedCompTypes.length === 1) {
    compScore = 1.8;
    matched.push("Basic camera perspective token included");
  } else {
    compScore = 0.0;
    missed.push("Include camera angle and framing parameters (e.g. low-angle, wide-shot, depth of field)");
  }

  // --------------------------------------------------------------------------
  // 4. STYLE, MEDIUM & RENDER ENGINE FIDELITY (0.0 to 5.0)
  // --------------------------------------------------------------------------
  let styleScore = 0;
  const mediumPatterns = /(digital concept art|concept art|matte painting|digital painting|3d render|studio photography|commercial photography|cinematic film still|architectural visualization|anime|oil painting|watercolor|illustration|isometric)/i;
  const renderTokens = /(unreal engine|octane render|ray tracing|8k|4k|photorealistic|hyperrealistic|masterpiece|artstation|cgsociety|vray|redshift|substance painter|houdini|blender)/i;
  const cameraSpecs = /(35mm|50mm|85mm|f\/1\.4|f\/2\.8|dslr|hasselblad|leica|arri alexa|anamorphic lens|iso \d+|shutter speed)/i;

  const hasMedium = mediumPatterns.test(text);
  const hasRenderTokens = renderTokens.test(text);
  const hasCameraSpecs = cameraSpecs.test(text);

  // Check matching against target style
  const targetStyleText = (targetCriteria.style || targetDesc).toLowerCase();
  const targetIsConceptArt = /concept art|digital art|matte painting/i.test(targetStyleText);
  const targetIsPhoto = /photography|photo|catalog/i.test(targetStyleText);
  const targetIs3DRender = /3d|render|octane|unreal/i.test(targetStyleText);

  let styleMatched = false;
  if (targetIsConceptArt && /(concept art|digital art|matte painting|illustration)/i.test(text)) styleMatched = true;
  if (targetIsPhoto && /(photography|photo|lens|dslr|studio)/i.test(text)) styleMatched = true;
  if (targetIs3DRender && /(3d|render|octane|unreal|ray tracing)/i.test(text)) styleMatched = true;

  if (styleMatched && (hasRenderTokens || hasCameraSpecs) && hasMedium) {
    styleScore = 4.8;
    matched.push("High-fidelity art medium & rendering engine specifications included");
  } else if (styleMatched && (hasRenderTokens || hasMedium)) {
    styleScore = 3.8;
    matched.push("Accurate artistic medium and style identified");
  } else if (hasRenderTokens || hasMedium || hasCameraSpecs) {
    styleScore = 2.5;
    matched.push("Generic render engine / quality modifiers specified");
    missed.push("Align exact medium with target (e.g. concept art vs studio product photography)");
  } else if (/(realistic|detailed|high quality|sharp)/i.test(text)) {
    styleScore = 1.0;
    missed.push("Specify exact rendering engine tokens (e.g. Unreal Engine 5, Octane, 8k resolution, 35mm lens)");
  } else {
    styleScore = 0.0;
    missed.push("Missing artistic medium and rendering quality specifications");
  }

  // --------------------------------------------------------------------------
  // Length & Off-Topic Calibrations
  // --------------------------------------------------------------------------
  // If prompt has 0 matches for subject AND 0 for colors, it is completely off-topic -> force 0
  if (matchedTargetWords.length === 0 && relevantColorMatches.length === 0 && !exactPerspectiveMatched) {
    return {
      composition_score: Math.min(1.0, compScore),
      colors_score: Math.min(0.5, colorsScore),
      subject_score: 0.0,
      style_score: Math.min(1.0, styleScore),
      total_score: Number((Math.min(1.0, compScore) + Math.min(0.5, colorsScore) + Math.min(1.0, styleScore)).toFixed(1)),
      reasoning: "Prompt does not match the assigned visual target. Identified minimal or no overlapping subject/color elements.",
      matched_elements: matched.length ? matched : ["Generic prompt structure"],
      missed_elements: ["Subject, color palette, and scene composition do not match target image"]
    };
  }

  // Final Score Clamping & Formatting
  compScore = Math.min(5, Math.max(0, Number(compScore.toFixed(1))));
  colorsScore = Math.min(5, Math.max(0, Number(colorsScore.toFixed(1))));
  subjScore = Math.min(5, Math.max(0, Number(subjScore.toFixed(1))));
  styleScore = Math.min(5, Math.max(0, Number(styleScore.toFixed(1))));

  const totalScore = Number((compScore + colorsScore + subjScore + styleScore).toFixed(1));

  let reasoning = "";
  if (totalScore >= 16) {
    reasoning = `Exemplary reverse engineering (${totalScore}/20)! Masterfully captured the target's perspective, specific color palette, physical subjects, and render style.`;
  } else if (totalScore >= 12) {
    reasoning = `Strong reverse engineering (${totalScore}/20). Accurately identified primary subjects and atmospheric lighting.`;
  } else if (totalScore >= 7) {
    reasoning = `Moderate visual approximation (${totalScore}/20). Core theme recognized, but missing specific camera perspective, color nuances, or render engine parameters.`;
  } else {
    reasoning = `Basic attempt (${totalScore}/20). Low visual overlap with target image. Enrich camera framing, exact lighting reflections, and distinct scene objects.`;
  }

  return {
    composition_score: compScore,
    colors_score: colorsScore,
    subject_score: subjScore,
    style_score: styleScore,
    total_score: totalScore,
    reasoning,
    matched_elements: matched.length ? matched : ["Basic prompt attempt"],
    missed_elements: missed.length ? missed : ["Could add specific lens aperture and lighting reflection parameters"]
  };
}
