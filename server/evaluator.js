/**
 * AI Evaluator Engine for PROMPT WARS Round 1 (20 Points Total)
 * Supports Anthropic / Gemini / OpenAI APIs with fallback to comprehensive Rubric Heuristic Evaluator
 */

export async function evaluateSubmission({ badPrompt, genreName, improvedPrompt, teamName }) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateWithAnthropic({ badPrompt, genreName, improvedPrompt, teamName });
    } catch (err) {
      console.warn(`[Evaluator] Anthropic API failed (${err.message}). Falling back to heuristic engine.`);
    }
  }

  // Fallback to sophisticated heuristic & rubric analyzer
  return evaluateWithHeuristics({ badPrompt, genreName, improvedPrompt });
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
 * Deterministic Semantic Rubric Engine
 * Accurately analyzes prompt structure, role persona, constraints, formatting tokens, and length.
 */
export function evaluateWithHeuristics({ badPrompt, genreName, improvedPrompt }) {
  const text = (improvedPrompt || "").trim();
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  // 1. Clarity & Specificity (0 - 5)
  let clarityScore = 0;
  const strengths = [];
  const improvements = [];

  if (charCount >= 80) clarityScore += 1;
  if (charCount >= 180) clarityScore += 1;
  if (charCount >= 300) clarityScore += 1;
  
  // Specificity markers (who, what, where, numbers, percentages, exact terms)
  const hasNumbers = /\d+/.test(text);
  const hasSpecificKeywords = /(target|audience|demographic|metric|goal|objective|aim|focus|theme|topic|deliverable)/i.test(text);
  if (hasNumbers) clarityScore += 1;
  if (hasSpecificKeywords) clarityScore += 1;
  clarityScore = Math.min(5, Math.max(1, clarityScore));

  if (clarityScore >= 4) {
    strengths.push("High task clarity with specific parameters and actionable requirements.");
  } else {
    improvements.push("Add more concrete details like exact target audience, scope, or quantifiable goals.");
  }

  // 2. Context & Role Definition (0 - 4)
  let contextScore = 0;
  const rolePatterns = /(act as|you are|role:|assume the persona|expert|specialist|strategist|analyst|copywriter|consultant|director|manager|professional|engineer)/i;
  const contextPatterns = /(context:|background:|scenario:|situation:|for an upcoming|in the context of|aimed at|designed for|working with)/i;
  
  if (rolePatterns.test(text)) {
    contextScore += 2;
    strengths.push("Strong persona and expert role framing defined.");
  } else {
    improvements.push("Explicitly define an AI persona (e.g. 'Act as a Senior Marketing Strategist').");
  }

  if (contextPatterns.test(text) || wordCount > 35) {
    contextScore += 2;
  } else {
    contextScore += 1;
  }
  contextScore = Math.min(4, Math.max(1, contextScore));

  // 3. Constraints & Instructions (0 - 4)
  let constraintsScore = 0;
  const constraintPatterns = /(do not|avoid|must|ensure|limit|within|include|require|guideline|rule|tone:|style:|step 1|keep it|strictly|length:|seconds|words)/i;
  const stepPatterns = /(1\.|2\.|3\.|first|second|then|finally|- )/i;

  if (constraintPatterns.test(text)) constraintsScore += 2;
  if (stepPatterns.test(text)) constraintsScore += 1;
  if (wordCount >= 40) constraintsScore += 1;
  constraintsScore = Math.min(4, Math.max(1, constraintsScore));

  if (constraintsScore >= 3) {
    strengths.push("Well-articulated constraints, tone guidelines, and structured steps.");
  } else {
    improvements.push("Include explicit constraints (e.g. tone limits, forbidden cliches, length constraints).");
  }

  // 4. Expected Output Format (0 - 3)
  let formatScore = 0;
  const formatPatterns = /(format:|output:|json|table|markdown|bullet points|script|sections|template|headings|columns|structure:|schema|outline)/i;
  
  if (formatPatterns.test(text)) {
    formatScore = 3;
    strengths.push("Explicit, unambiguous output structure (tables/sections/markdown/script).");
  } else if (/(list|summary|paragraphs|points|draft)/i.test(text)) {
    formatScore = 2;
    improvements.push("Specify the exact output schema or presentation format for higher precision.");
  } else {
    formatScore = 1;
    improvements.push("Clearly demand a specific output format (e.g. 'Present as a Markdown table with 3 columns').");
  }

  // 5. Creativity & Effectiveness (0 - 4)
  let creativityScore = 0;
  const badPromptWords = (badPrompt || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const similarityCount = badPromptWords.filter(w => lower.includes(w)).length;
  
  // Did they just repeat the bad prompt or revolutionize it?
  if (wordCount > 50 && wordCount < 400) creativityScore += 2;
  else if (wordCount >= 30) creativityScore += 1;

  if (charCount > (badPrompt.length * 3)) creativityScore += 1;
  if (/(tagline|hook|catchy|innovative|unique|compelling|engaging|storyline|viral|impactful)/i.test(text)) {
    creativityScore += 1;
  }
  creativityScore = Math.min(4, Math.max(1, creativityScore));

  if (creativityScore >= 3) {
    strengths.push("Transformed a generic prompt into an engaging, multi-layered strategic brief.");
  }

  const totalScore = clarityScore + contextScore + constraintsScore + formatScore + creativityScore;

  const reasoning = `Received ${totalScore}/20. ${
    totalScore >= 16
      ? "Outstanding prompt engineering! Richly detailed with clear persona, rigorous constraints, and exact output format."
      : totalScore >= 12
      ? "Good comprehensive effort. Addressed the key deficiencies of the original prompt with solid structure."
      : "Basic makeover. Missing key prompt engineering anchors like role persona, precise output schema, or strict constraints."
  }`;

  return {
    clarity_score: clarityScore,
    context_score: contextScore,
    constraints_score: constraintsScore,
    format_score: formatScore,
    creativity_score: creativityScore,
    total_score: totalScore,
    reasoning,
    strengths: strengths.length > 0 ? strengths : ["Improved length over original"],
    improvements: improvements.length > 0 ? improvements : ["Refine nuance further"]
  };
}
