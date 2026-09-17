/**
 * AI Evaluator Engine for PROMPT WARS Round 2: Prompt Reverse Engineering
 * Challenge 1 (Image Reverse Engineering, 20 pts)
 * Challenge 2 (Report Reverse Engineering, 20 pts)
 * Combined Total: 40 pts
 */

export async function evaluateRound2Challenge1({ targetImage, studentPrompt, teamName }) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateImageWithAnthropic({ targetImage, studentPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator C1] Anthropic API failed (${err.message}). Falling back.`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateImageWithGemini({ targetImage, studentPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator C1] Gemini API failed (${err.message}). Falling back.`);
    }
  }

  return evaluateImageWithHeuristics({ targetImage, studentPrompt });
}

export async function evaluateRound2Challenge2({ targetReport, studentPrompt, teamName }) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateReportWithAnthropic({ targetReport, studentPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator C2] Anthropic API failed (${err.message}). Falling back.`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateReportWithGemini({ targetReport, studentPrompt });
    } catch (err) {
      console.warn(`[Round2 Evaluator C2] Gemini API failed (${err.message}). Falling back.`);
    }
  }

  return evaluateReportWithHeuristics({ targetReport, studentPrompt });
}

// --- Anthropic Image Evaluator ---
async function evaluateImageWithAnthropic({ targetImage, studentPrompt }) {
  const prompt = `You are an expert visual prompt reverse-engineering judge for PROMPT WARS Round 2.
Participants were shown a specific AI-generated target visual and asked to write a prompt that accurately reproduces it.

TARGET VISUAL DETAILS:
- Title: ${targetImage.title}
- Description: ${targetImage.description}
- Key Elements: ${JSON.stringify(targetImage.keyElements || [])}
- Target Visual Prompt: "${targetImage.targetVisualPrompt}"

STUDENT'S REVERSE-ENGINEERED PROMPT:
"${studentPrompt}"

Evaluate how accurately this student prompt captures the target visual across these 4 criteria (Total 20 pts):
1. Composition & Layout (0-5 pts): Camera perspective, aspect ratio, spatial positioning, depth of field.
2. Colors & Lighting (0-5 pts): Palette matching, lighting atmosphere, shadows, glow/contrast.
3. Subject & Content (0-5 pts): Correct primary and secondary subjects, architectural/hardware details.
4. Style & Artistic Elements (0-5 pts): Rendering engine cues (Octane, Unreal, Macro photography), fidelity, mood.

Respond ONLY with valid JSON in this exact schema:
{
  "composition_score": <number 0-5>,
  "colors_score": <number 0-5>,
  "subject_score": <number 0-5>,
  "style_score": <number 0-5>,
  "total_score": <number 0-20>,
  "reasoning": "<string constructive feedback on visual accuracy>",
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
  return JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
}

// --- Gemini Image Evaluator ---
async function evaluateImageWithGemini({ targetImage, studentPrompt }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an expert visual prompt reverse-engineering judge for PROMPT WARS Round 2.
Target Visual: ${targetImage.title} - ${targetImage.description}
Key Elements: ${JSON.stringify(targetImage.keyElements || [])}
Target Reference Prompt: "${targetImage.targetVisualPrompt}"
Student Prompt: "${studentPrompt}"

Score from 0 to 5 on:
1. composition_score (0-5)
2. colors_score (0-5)
3. subject_score (0-5)
4. style_score (0-5)
total_score (0-20), reasoning, matched_elements (array), missed_elements (array).
Respond in JSON only.`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    })
  });

  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(rawText);
}

// --- Heuristic Image Evaluator ---
export function evaluateImageWithHeuristics({ targetImage, studentPrompt }) {
  const text = (studentPrompt || "").trim();
  const lower = text.toLowerCase();
  const charCount = text.length;

  let compositionScore = 1;
  let colorsScore = 1;
  let subjectScore = 1;
  let styleScore = 1;
  const matched = [];
  const missed = [];

  // Composition patterns
  if (/(wide angle|panoramic|cinematic|perspective|macro|close up|aerial|top down|centered|depth of field|bokeh|aspect ratio|16:9|1:1|symmetry)/i.test(text)) {
    compositionScore += 2;
    matched.push("Camera perspective & composition cues specified");
  }
  if (charCount > 120) compositionScore += 1;
  if (charCount > 250) compositionScore += 1;

  // Colors & Lighting patterns
  if (/(sunset|golden hour|neon|glow|lighting|volumetric|shadows|ambient|reflections|cyan|emerald|gold|obsidian|warm|cool|rim light)/i.test(text)) {
    colorsScore += 2;
    matched.push("Atmospheric lighting & color palette identified");
  } else {
    missed.push("Missing specific lighting conditions and exact color spectrum");
  }
  if (charCount > 150) colorsScore += 2;

  // Subject & Content
  const keyWords = (targetImage.description || "").toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const matchedKeywords = keyWords.filter(kw => lower.includes(kw));
  if (matchedKeywords.length >= 4) {
    subjectScore += 3;
    matched.push(`Directly referenced key subjects: ${matchedKeywords.slice(0, 3).join(', ')}`);
  } else if (matchedKeywords.length >= 2) {
    subjectScore += 2;
  } else {
    subjectScore += 1;
    missed.push("Could include more granular primary and secondary subjects");
  }
  if (charCount > 200) subjectScore += 1;

  // Style & Rendering cues
  if (/(unreal engine|octane render|photorealistic|hyperrealistic|8k|4k|ray tracing|masterpiece|studio photography|lens|dslr|rendering)/i.test(text)) {
    styleScore += 3;
    matched.push("High-fidelity artistic rendering & medium tokens included");
  } else {
    styleScore += 1;
    missed.push("Add rendering engine parameters or lens specifications");
  }
  if (charCount > 180) styleScore += 1;

  compositionScore = Math.min(5, Math.max(1, compositionScore));
  colorsScore = Math.min(5, Math.max(1, colorsScore));
  subjectScore = Math.min(5, Math.max(1, subjectScore));
  styleScore = Math.min(5, Math.max(1, styleScore));

  const totalScore = compositionScore + colorsScore + subjectScore + styleScore;
  return {
    composition_score: compositionScore,
    colors_score: colorsScore,
    subject_score: subjectScore,
    style_score: styleScore,
    total_score: totalScore,
    reasoning: `Reverse engineering accuracy: ${totalScore}/20. ${
      totalScore >= 16
        ? "Exemplary visual dissection! Masterfully captured composition, lighting, and rendering style."
        : totalScore >= 12
        ? "Solid prompt reverse-engineering with good subject and color recognition."
        : "Basic recreation. Lacks camera perspective, lighting nuance, or render style cues."
    }`,
    matched_elements: matched.length ? matched : ["Basic subject referenced"],
    missed_elements: missed.length ? missed : ["Fine stylistic parameters"]
  };
}

// --- Anthropic Report Evaluator ---
async function evaluateReportWithAnthropic({ targetReport, studentPrompt }) {
  const prompt = `You are an expert prompt reverse-engineering adjudicator for PROMPT WARS Round 2 Challenge 2.
Participants were shown a comprehensive structured report and asked to create a prompt that would reproduce its exact layout, numbers, and depth.

TARGET REPORT TITLE: ${targetReport.title}
TARGET REPORT SUMMARY: ${targetReport.reportSummary}
TARGET REPORT SAMPLE:
${targetReport.targetReportMarkdown}

STUDENT'S REVERSE-ENGINEERED PROMPT:
"${studentPrompt}"

Evaluate the prompt on these 4 criteria (Total 20 pts):
1. Structure & Organization (0-5 pts): Demands executive summary, specific tables, unit economics, outlook.
2. Content & Data Accuracy (0-5 pts): Demands key financial figures, percentages, quarters, and metrics.
3. Formatting & Presentation (0-5 pts): Specifies markdown tables, alignment, currency symbols, and headers.
4. Insights & Analysis (0-5 pts): Demands strategic context, unit economic drivers, and capital planning.

Respond ONLY with valid JSON in this schema:
{
  "structure_score": <number 0-5>,
  "content_score": <number 0-5>,
  "formatting_score": <number 0-5>,
  "insights_score": <number 0-5>,
  "total_score": <number 0-20>,
  "reasoning": "<string summary>",
  "captured_requirements": ["<string>"],
  "omitted_requirements": ["<string>"]
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
  return JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
}

// --- Gemini Report Evaluator ---
async function evaluateReportWithGemini({ targetReport, studentPrompt }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are an expert prompt reverse-engineering adjudicator for PROMPT WARS Round 2 Challenge 2.
Target Report: ${targetReport.title}
Target Report Context: ${targetReport.reportSummary}
Student Prompt: "${studentPrompt}"

Score 0-5 on:
1. structure_score (0-5)
2. content_score (0-5)
3. formatting_score (0-5)
4. insights_score (0-5)
total_score (0-20), reasoning, captured_requirements (array), omitted_requirements (array).
Respond in JSON only.`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    })
  });

  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(rawText);
}

// --- Heuristic Report Evaluator ---
export function evaluateReportWithHeuristics({ targetReport, studentPrompt }) {
  const text = (studentPrompt || "").trim();
  const charCount = text.length;

  let structureScore = 1;
  let contentScore = 1;
  let formattingScore = 1;
  let insightsScore = 1;
  const captured = [];
  const omitted = [];

  // Structure
  if (/(executive summary|quarter|table|sections|outline|breakdown|roadmap|strategic outlook|structure)/i.test(text)) {
    structureScore += 2;
    captured.push("Multi-section hierarchy demanded");
  }
  if (charCount > 150) structureScore += 2;

  // Content & Data
  if (/(arr|mrr|ebitda|gross margin|revenue|cogs|cac|retention|kpi|q1|q2|q3|q4|\$|\%|\d+)/i.test(text)) {
    contentScore += 3;
    captured.push("Detailed financial metrics and numeric data requested");
  } else {
    omitted.push("Could demand explicit numerical targets and metric names");
  }
  if (charCount > 200) contentScore += 1;

  // Formatting
  if (/(markdown|table|columns|currency|bullet points|bold|headers|subtotals|presentation)/i.test(text)) {
    formattingScore += 3;
    captured.push("Explicit markdown tables and presentation guidelines requested");
  } else {
    omitted.push("Demand explicit markdown table format with columns");
  }
  if (charCount > 120) formattingScore += 1;

  // Insights
  if (/(strategic|analysis|unit economics|drivers|optimization|recommendations|expansion|utilization)/i.test(text)) {
    insightsScore += 3;
    captured.push("Strategic commentary and unit economic drivers included");
  } else {
    omitted.push("Include requirements for strategic takeaways and capital outlook");
  }
  if (charCount > 180) insightsScore += 1;

  structureScore = Math.min(5, Math.max(1, structureScore));
  contentScore = Math.min(5, Math.max(1, contentScore));
  formattingScore = Math.min(5, Math.max(1, formattingScore));
  insightsScore = Math.min(5, Math.max(1, insightsScore));

  const totalScore = structureScore + contentScore + formattingScore + insightsScore;
  return {
    structure_score: structureScore,
    content_score: contentScore,
    formatting_score: formattingScore,
    insights_score: insightsScore,
    total_score: totalScore,
    reasoning: `Report Reverse Engineering score: ${totalScore}/20. ${
      totalScore >= 16
        ? "Masterful extraction of financial structure, table schemas, and strategic metrics!"
        : totalScore >= 12
        ? "Good reverse-engineered specification covering primary sections and tables."
        : "Basic prompt. Lacks table column requirements, specific financial metric names, or output schemas."
    }`,
    captured_requirements: captured.length ? captured : ["Basic report request"],
    omitted_requirements: omitted.length ? omitted : ["Granular table schemas"]
  };
}
