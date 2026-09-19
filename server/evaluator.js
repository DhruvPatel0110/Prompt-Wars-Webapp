/**
 * AI Evaluator Engine for PROMPT WARS Round 1 (20 Points Total)
 * Provider priority: Groq (free tier) → Gemini → OpenAI → Anthropic → Heuristics
 */
import { generateGeminiContent } from './geminiClient.js';

// Shared rubric prompt builder (used by all AI evaluators)
function buildEvalPrompt({ badPrompt, genreName, improvedPrompt }) {
  return `You are the Official AI Adjudicator for the PROMPT WARS Championship.
Evaluate this student's prompt engineering makeover strictly, fairly, and comprehensively on the 20-point standard rubric.

COMPETITION DOMAIN: "${genreName}"
ORIGINAL WEAK / DEFECTIVE PROMPT: "${badPrompt}"
STUDENT'S RECONSTRUCTED PROMPT:
"""${improvedPrompt}"""

EVALUATE STRICTLY ON THE 5 COMPETITION PILLARS (Total 20 points):
1. Clarity & Specificity (0-5 pts): Is the prompt explicit, precise, actionable, and unambiguous?
2. Context & Persona Definition (0-4 pts): Does it define an expert role/persona, relevant scenario context, and target audience?
3. Constraints & Guardrails (0-4 pts): Are negative constraints ("avoid X"), scope boundaries, and tone rules clearly stated?
4. Output Structure & Schema (0-3 pts): Does it specify the exact deliverable format (headers, sections, bullet points, tables)?
5. Creativity & Practical Depth (0-4 pts): Does it demonstrate sophisticated prompt engineering techniques (chain-of-thought, few-shot hints, domain expertise)?

SCORING RULES & CALIBRATION:
- Be rigorous and fair: Generic, brief prompts without constraints should score 6-11/20. Well-architected prompts with persona, constraints, and structure should score 14-19/20.
- Ensure total_score equals the exact sum of all 5 criteria scores.

Respond ONLY with valid JSON matching this exact schema (no markdown, no explanation — JSON only):
{"clarity_score":<number 0-5>,"context_score":<number 0-4>,"constraints_score":<number 0-4>,"format_score":<number 0-3>,"creativity_score":<number 0-4>,"total_score":<number 0-20>,"reasoning":"<concise constructive adjudication>","strengths":["<strength 1>","<strength 2>"],"improvements":["<actionable improvement 1>","<actionable improvement 2>"]}`;
}

// Parse and sanitize AI evaluation result
function sanitizeEvalResult(res) {
  const clarity = Math.min(5, Math.max(0, Number(res.clarity_score) || 0));
  const context = Math.min(4, Math.max(0, Number(res.context_score) || 0));
  const constraints = Math.min(4, Math.max(0, Number(res.constraints_score) || 0));
  const format = Math.min(3, Math.max(0, Number(res.format_score) || 0));
  const creativity = Math.min(4, Math.max(0, Number(res.creativity_score) || 0));
  const total = clarity + context + constraints + format + creativity;
  return {
    clarity_score: clarity,
    context_score: context,
    constraints_score: constraints,
    format_score: format,
    creativity_score: creativity,
    total_score: total,
    reasoning: res.reasoning || `Scored ${total}/20 across clarity, context, constraints, format, and creativity.`,
    strengths: Array.isArray(res.strengths) && res.strengths.length > 0 ? res.strengths : ["Structured prompt makeover"],
    improvements: Array.isArray(res.improvements) && res.improvements.length > 0 ? res.improvements : ["Add further role depth and explicit negative constraints"]
  };
}

export async function evaluateSubmission({ badPrompt, genreName, improvedPrompt, teamName }) {
  // 1. Groq (free tier - fastest, most generous rate limits)
  if (process.env.GROQ_API_KEY) {
    try {
      return await evaluateWithGroq({ badPrompt, genreName, improvedPrompt });
    } catch (err) {
      console.warn(`[Evaluator] Groq API failed (${err.message}). Trying Gemini.`);
    }
  }

  // 2. Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateWithGemini({ badPrompt, genreName, improvedPrompt, teamName });
    } catch (err) {
      console.warn(`[Evaluator] Gemini API failed (${err.message}). Trying OpenAI.`);
    }
  }

  // 3. OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      return await evaluateWithOpenAI({ badPrompt, genreName, improvedPrompt, teamName });
    } catch (err) {
      console.warn(`[Evaluator] OpenAI API failed (${err.message}). Trying Anthropic.`);
    }
  }

  // 4. Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateWithAnthropic({ badPrompt, genreName, improvedPrompt, teamName });
    } catch (err) {
      console.warn(`[Evaluator] Anthropic API failed (${err.message}). Falling back to heuristics.`);
    }
  }

  // 5. Fallback to sophisticated heuristic & rubric analyzer
  return evaluateWithHeuristics({ badPrompt, genreName, improvedPrompt });
}

// --- Groq Evaluator (Primary - Free Tier with resilient model fallback) ---
async function evaluateWithGroq({ badPrompt, genreName, improvedPrompt }) {
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
            {
              role: "system",
              content: "You are an expert prompt engineering adjudicator for the PROMPT WARS championship. Output valid JSON only — no markdown, no commentary."
            },
            {
              role: "user",
              content: buildEvalPrompt({ badPrompt, genreName, improvedPrompt })
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq model ${model} HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      return sanitizeEvalResult(parsed);
    } catch (err) {
      lastError = err;
      console.warn(`[Evaluator] Groq model ${model} failed (${err.message}), trying next candidate...`);
    }
  }

  throw lastError || new Error("All Groq candidate models failed.");
}

async function evaluateWithGemini({ badPrompt, genreName, improvedPrompt, teamName }) {
  const prompt = buildEvalPrompt({ badPrompt, genreName, improvedPrompt });
  const res = await generateGeminiContent({ prompt, jsonMode: true, temperature: 0.2 });
  if (res && typeof res === 'object') {
    return sanitizeEvalResult(res);
  }
  throw new Error('Gemini returned empty/invalid response');
}


async function evaluateWithOpenAI({ badPrompt, genreName, improvedPrompt }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are an expert prompt engineering adjudicator. Output valid JSON only."
        },
        {
          role: "user",
          content: `Evaluate this improved prompt for PROMPT WARS:
BAD PROMPT: "${badPrompt}"
GENRE: "${genreName}"
IMPROVED PROMPT: "${improvedPrompt}"

Criteria (20 pts):
1. clarity_score (0-5)
2. context_score (0-4)
3. constraints_score (0-4)
4. format_score (0-3)
5. creativity_score (0-4)
total_score (0-20), reasoning, strengths (array), improvements (array)`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

async function evaluateWithAnthropic({ badPrompt, genreName, improvedPrompt }) {
  const prompt = `You are an expert prompt engineering evaluator for the PROMPT WARS championship.
A team has improved the following weak/bad prompt:

BAD PROMPT: "${badPrompt}"
GENRE: "${genreName}"

IMPROVED PROMPT (by team):
"${improvedPrompt}"

Evaluate this improved prompt strictly on the following 5 criteria (Total 20 points):
1. Clarity and Specificity (0-5 pts): Is the prompt clear, explicit, and unambiguous?
2. Context and Role Definition (0-4 pts): Does it define a persona/role and rich context?
3. Constraints and Instructions (0-4 pts): Are guidelines, negative constraints, and parameters well-defined?
4. Expected Output Format (0-3 pts): Does it clearly specify the structure, tone, or format of the output?
5. Creativity and Effectiveness (0-4 pts): Does it provide a massive improvement over the bad prompt?

Respond ONLY with a valid JSON object matching this exact schema:
{
  "clarity_score": <number 0-5>,
  "context_score": <number 0-4>,
  "constraints_score": <number 0-4>,
  "format_score": <number 0-3>,
  "creativity_score": <number 0-4>,
  "total_score": <number 0-20>,
  "reasoning": "<string constructive feedback on strengths and weaknesses>",
  "strengths": ["<string>", "<string>"],
  "improvements": ["<string>"]
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

  if (!response.ok) {
    throw new Error(`Anthropic HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || "{}";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Invalid JSON response from Anthropic");
}

/**
 * Concurrent Worker Pool for Batch Evaluations
 * Evaluates multiple teams with controlled concurrency and smooth pacing.
 */
export async function evaluateBatchWithConcurrency(items, evaluatorFn, concurrency = 2, onProgress = null) {
  const results = {};
  let completed = 0;
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentItem = items[index++];
      try {
        const result = await evaluatorFn(currentItem);
        results[currentItem.id] = result;
      } catch (err) {
        console.log(`[Evaluator] Heuristic rubric scoring applied for ${currentItem.name || currentItem.id}`);
        results[currentItem.id] = evaluateWithHeuristics({
          badPrompt: currentItem.badPrompt || "Weak prompt",
          genreName: currentItem.genreName || "CREATIVE",
          improvedPrompt: currentItem.improvedPrompt || ""
        });
      }
      completed++;
      if (onProgress) {
        onProgress({
          completed,
          total: items.length,
          currentTeam: currentItem.name || currentItem.id,
          result: results[currentItem.id]
        });
      }
      // Pacing interval to prevent rate spikes
      await new Promise(r => setTimeout(r, 300));
    }
  }

  const workerCount = Math.min(concurrency, Math.max(1, items.length));
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Deterministic Semantic Rubric Engine
 * Accurately analyzes prompt structure, role persona, constraints, formatting tokens, domain depth, and length.
 */
export function evaluateWithHeuristics({ badPrompt, genreName, improvedPrompt }) {
  const text = (improvedPrompt || "").trim();
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const genre = (genreName || "CREATIVE").toUpperCase();

  // Strict check for empty / null / placeholder prompts
  if (!text || charCount < 10 || /^no prompt submitted/i.test(text)) {
    return {
      clarity_score: 0,
      context_score: 0,
      constraints_score: 0,
      format_score: 0,
      creativity_score: 0,
      total_score: 0,
      reasoning: "No valid prompt submitted (0/20). Reconstruct the weak prompt with a clear role, context, constraints, and output format to score.",
      strengths: [],
      improvements: ["Submit a reconstructed prompt to receive evaluation."]
    };
  }

  // 1. Clarity & Specificity (0 - 5)
  let clarityScore = 0;
  const strengths = [];
  const improvements = [];

  if (charCount >= 60) clarityScore += 1;
  if (charCount >= 160) clarityScore += 1;
  if (charCount >= 280) clarityScore += 1;
  
  // Specificity markers (who, what, where, numbers, percentages, exact terms)
  const hasNumbers = /\d+/.test(text);
  const hasSpecificKeywords = /(target|audience|demographic|metric|goal|objective|aim|focus|theme|topic|deliverable|kpi|milestone)/i.test(text);
  if (hasNumbers) clarityScore += 1;
  if (hasSpecificKeywords) clarityScore += 1;
  clarityScore = Math.min(5, Math.max(1, clarityScore));

  if (clarityScore >= 4) {
    strengths.push("High task clarity with concrete parameters and explicit deliverables.");
  } else {
    improvements.push("Incorporate quantifiable targets, exact audience segments, or explicit scope boundaries.");
  }

  // 2. Context & Role Definition (0 - 4)
  let contextScore = 0;
  const rolePatterns = /(act as|you are|role:|assume the persona|expert|specialist|strategist|analyst|copywriter|consultant|director|manager|professional|engineer|architect|lead)/i;
  const contextPatterns = /(context:|background:|scenario:|situation:|for an upcoming|in the context of|aimed at|designed for|working with|problem statement)/i;
  
  if (rolePatterns.test(text)) {
    contextScore += 2;
    strengths.push("Explicit domain persona and authoritative role framing defined.");
  } else {
    improvements.push("Specify an expert persona (e.g. 'Act as a Senior AI Architect' or 'Act as a Brand Strategist').");
  }

  if (contextPatterns.test(text) || wordCount > 35) {
    contextScore += 2;
  } else {
    contextScore += 1;
  }
  contextScore = Math.min(4, Math.max(1, contextScore));

  // 3. Constraints & Instructions (0 - 4)
  let constraintsScore = 0;
  const constraintPatterns = /(do not|avoid|must|ensure|limit|within|include|require|guideline|rule|tone:|style:|step 1|keep it|strictly|length:|seconds|words|never|without)/i;
  const stepPatterns = /(1\.|2\.|3\.|first|second|then|finally|- |step\s*\d)/i;

  if (constraintPatterns.test(text)) constraintsScore += 2;
  if (stepPatterns.test(text)) constraintsScore += 1;
  if (wordCount >= 35) constraintsScore += 1;
  constraintsScore = Math.min(4, Math.max(1, constraintsScore));

  if (constraintsScore >= 3) {
    strengths.push("Rigorous guardrails, negative constraints, and structured sequencing.");
  } else {
    improvements.push("Add negative exclusions (e.g. 'Avoid generic clichés' or 'Do not use technical jargon') to prevent hallucination.");
  }

  // 4. Expected Output Format (0 - 3)
  let formatScore = 0;
  const formatPatterns = /(format:|output:|json|table|markdown|bullet points|script|sections|template|headings|columns|structure:|schema|outline|xml|yaml)/i;
  
  if (formatPatterns.test(text)) {
    formatScore = 3;
    strengths.push("Unambiguous output schema (structured Markdown tables/sections/JSON).");
  } else if (/(list|summary|paragraphs|points|draft|response)/i.test(text)) {
    formatScore = 2;
    improvements.push("Demand a strict deliverable format (e.g. 'Output as a 3-column Markdown table').");
  } else {
    formatScore = 1;
    improvements.push("Clearly state the required presentation format (tables, headers, or bullet points).");
  }

  // 5. Creativity & Practical Depth (0 - 4)
  let creativityScore = 0;
  const badPromptWords = (badPrompt || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const similarityCount = badPromptWords.filter(w => lower.includes(w)).length;
  
  if (wordCount > 45 && wordCount < 450) creativityScore += 2;
  else if (wordCount >= 25) creativityScore += 1;

  if (charCount > (badPrompt.length * 2.5)) creativityScore += 1;
  if (/(tagline|hook|catchy|innovative|unique|compelling|engaging|storyline|viral|impactful|architecture|framework|benchmark|roi|funnel)/i.test(text)) {
    creativityScore += 1;
  }
  creativityScore = Math.min(4, Math.max(1, creativityScore));

  if (creativityScore >= 3) {
    strengths.push(`Transformed a weak generic query into a sophisticated, multi-layered ${genre} brief.`);
  }

  const totalScore = clarityScore + contextScore + constraintsScore + formatScore + creativityScore;

  const reasoning = `Awarded ${totalScore}/20 on the official championship rubric. ${
    totalScore >= 16
      ? `Exemplary prompt engineering in ${genre}! Masterful persona framing, rigorous constraints, and crystal-clear output formatting.`
      : totalScore >= 12
      ? `Strong prompt makeover in ${genre}. Good structural improvement over the defective baseline with solid context.`
      : `Basic prompt makeover in ${genre}. Needs more comprehensive persona definition, explicit negative guardrails, and output schemas.`
  }`;

  return {
    clarity_score: clarityScore,
    context_score: contextScore,
    constraints_score: constraintsScore,
    format_score: formatScore,
    creativity_score: creativityScore,
    total_score: totalScore,
    reasoning,
    strengths: strengths.length > 0 ? strengths : ["Improved length and structure over defective baseline"],
    improvements: improvements.length > 0 ? improvements : ["Add further domain-specific nuance and negative guardrails"]
  };
}
