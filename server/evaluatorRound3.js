import { generateGeminiContent } from './geminiClient.js';

/**
 * Supreme AI Adjudicator for PROMPT WARS ROUND 3: GRAND FINALE
 * Total 50 Points:
 *  - Master Strategy Prompt (30 pts): Case Comprehension (5), Role/Persona (5), Constraints Control (5), Output Structuring (5), Strategic Depth (5), Prompt Technique (5)
 *  - Final Bomb Adaptation (20 pts): Condition Adaptation (5), Surgical Precision (5), Objective Preservation (5), Adapted Execution Quality (5)
 */
export async function evaluateRound3Submission({ caseData, bombData, masterPrompt, adaptedPrompt, teamName }) {
  const masterText = (masterPrompt || "").trim();
  const adaptedText = (adaptedPrompt || masterText || "").trim();

  // Strict check for empty, placeholder, or trivial prompts (< 20 chars) -> 0/50
  if (masterText.length < 20 && adaptedText.length < 20) {
    return {
      master_scores: {
        case_comprehension: 0,
        role_persona: 0,
        constraints_control: 0,
        output_structuring: 0,
        strategic_depth: 0,
        prompt_technique: 0
      },
      master_subtotal: 0,
      bomb_scores: {
        condition_adaptation: 0,
        surgical_precision: 0,
        objective_preservation: 0,
        adapted_execution_quality: 0
      },
      bomb_subtotal: 0,
      total_score: 0,
      key_strengths: "No valid submission recorded.",
      areas_for_improvement: "Submit both a detailed Master Strategy Prompt and an Adapted Crisis Prompt to receive scores.",
      verdict_summary: "Disqualified for round scoring: Empty or insufficient prompt (0/50 points)."
    };
  }

  // 1. Try Groq (Llama 3.3 70B Versatile)
  if (process.env.GROQ_API_KEY) {
    try {
      return await evaluateRound3WithGroq({ caseData, bombData, masterPrompt: masterText, adaptedPrompt: adaptedText });
    } catch (err) {
      console.warn(`[Round3 Evaluator] Groq API failed (${err.message}). Trying Gemini...`);
    }
  }

  // 2. Try Gemini (Gemini 1.5 Flash / Pro)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateRound3WithGemini({ caseData, bombData, masterPrompt: masterText, adaptedPrompt: adaptedText });
    } catch (err) {
      console.warn(`[Round3 Evaluator] Gemini API failed (${err.message}). Trying Anthropic...`);
    }
  }

  // 3. Try Anthropic (Claude 3.5 Sonnet)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateRound3WithAnthropic({ caseData, bombData, masterPrompt: masterText, adaptedPrompt: adaptedText });
    } catch (err) {
      console.warn(`[Round3 Evaluator] Anthropic API failed (${err.message}). Trying OpenAI...`);
    }
  }

  // 4. Try OpenAI (GPT-4o / GPT-4o-mini)
  if (process.env.OPENAI_API_KEY) {
    try {
      return await evaluateRound3WithOpenAI({ caseData, bombData, masterPrompt: masterText, adaptedPrompt: adaptedText });
    } catch (err) {
      console.warn(`[Round3 Evaluator] OpenAI API failed (${err.message}). Falling back to Heuristics...`);
    }
  }

  // 5. Calibrated Multi-Criteria Semantic Heuristics Engine
  return evaluateRound3WithHeuristics({ caseData, bombData, masterPrompt: masterText, adaptedPrompt: adaptedText });
}

// --- Groq Evaluator (Llama 3.3 70B & 8B Fallbacks) ---
async function evaluateRound3WithGroq({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const prompt = buildEvaluationPrompt({ caseData, bombData, masterPrompt, adaptedPrompt });
  const candidateModels = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
  ];

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
          temperature: 0.15,
          max_tokens: 1800,
          messages: [
            {
              role: "system",
              content: "You are the Supreme AI Adjudicator for PROMPT WARS GRAND FINALE. You score prompt blueprints with extreme rigor and precision out of 50 total points. Output strictly valid JSON."
            },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq ${model} HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      return normalizeEvaluationPayload(parsed);
    } catch (err) {
      lastError = err;
      console.warn(`[Round3 Evaluator] Groq model ${model} failed (${err.message}), trying next candidate...`);
    }
  }

  throw lastError || new Error("All Groq candidate models failed for Round 3.");
}

// --- Gemini Evaluator ---
async function evaluateRound3WithGemini({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const prompt = buildEvaluationPrompt({ caseData, bombData, masterPrompt, adaptedPrompt });
  const result = await generateGeminiContent({
    prompt: `You are the Supreme AI Adjudicator for PROMPT WARS GRAND FINALE. Output strict JSON.\n\n${prompt}`,
    jsonMode: true,
    temperature: 0.15
  });

  return normalizeEvaluationPayload(result);
}

// --- Anthropic Evaluator ---
async function evaluateRound3WithAnthropic({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const prompt = buildEvaluationPrompt({ caseData, bombData, masterPrompt, adaptedPrompt });
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      temperature: 0.15,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);
  const data = await response.json();
  const rawText = data.content?.[0]?.text || "{}";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  return normalizeEvaluationPayload(parsed);
}

// --- OpenAI Evaluator ---
async function evaluateRound3WithOpenAI({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const prompt = buildEvaluationPrompt({ caseData, bombData, masterPrompt, adaptedPrompt });
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.15,
      max_tokens: 1500,
      messages: [
        { role: "system", content: "You are the Supreme AI Adjudicator for PROMPT WARS. Output strict JSON." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return normalizeEvaluationPayload(parsed);
}

// --- Prompt Builder for AI Engines ---
function buildEvaluationPrompt({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  return `You are the Supreme AI Adjudicator for PROMPT WARS ROUND 3: GRAND FINALE.

CASE STUDY DETAILS:
Title: ${caseData.title}
Category: ${caseData.category || 'Strategic Operations'}
Context Scenario: ${caseData.scenario?.context}
Key Numerical Metrics & Constraints: ${JSON.stringify(caseData.scenario?.metrics || {})}
5 Required Strategic Pillars: ${JSON.stringify(caseData.scenario?.requiredPillars || [])}

INJECTED CRISIS SABOTAGE ("THE BOMB"):
Headline: ${bombData.headline}
Description: ${bombData.description}
Directive: ${bombData.directive}

STUDENT SUBMISSIONS:
--- PHASE 1: MASTER STRATEGY PROMPT ---
"""
${masterPrompt || ""}
"""

--- PHASE 2: ADAPTED CRISIS PROMPT (POST-SABOTAGE) ---
"""
${adaptedPrompt || masterPrompt || ""}
"""

EVALUATION RUBRIC & SCORING (MAX 50.0 POINTS):
PART 1: MASTER STRATEGY BLUEPRINT (MAX 30.0 POINTS)
1. case_comprehension (0.0 to 5.0): Did the student accurately grasp the domain context and explicitly incorporate the provided key numerical metrics?
2. role_persona (0.0 to 5.0): Is there a commanding, domain-expert persona (e.g. Lead Operations Director, Chief Marketing Officer, Principal Architect) with clear voice and authority?
3. constraints_control (0.0 to 5.0): Are strict guardrails, budget limits, non-negotiable rules, negative constraints ("DO NOT", "AVOID"), and safety bounds explicitly codified?
4. output_structuring (0.0 to 5.0): Does the prompt enforce structured deliverables (e.g., Markdown comparison tables, phase breakdown, milestone checklists, JSON schemas)?
5. strategic_depth (0.0 to 5.0): Does the blueprint comprehensively cover all 5 required strategic pillars with practical, high-impact implementation steps?
6. prompt_technique (0.0 to 5.0): Are advanced prompting methodologies present (few-shot patterns, chain-of-thought instructions, system/context tags, variable inputs)?
Subtotal: master_subtotal = sum of 1..6 (0.0 to 30.0)

PART 2: CRISIS SABOTAGE ADAPTATION (MAX 20.0 POINTS)
7. condition_adaptation (0.0 to 5.0): How directly and completely did the prompt pivot to address the injected sabotage directive (e.g., slashed budget, compressed timeline, server outage)?
8. surgical_precision (0.0 to 5.0): Did the student cleanly modify the strategy with surgical diffs rather than writing irrelevant text or abandoning the core framework?
9. objective_preservation (0.0 to 5.0): Did the adapted prompt preserve the ultimate mission goal despite the aggressive crisis constraint?
10. adapted_execution_quality (0.0 to 5.0): Is the final adapted prompt robust, actionable, and ready for deployment under crisis conditions?
Subtotal: bomb_subtotal = sum of 7..10 (0.0 to 20.0)

Total Score: total_score = master_subtotal + bomb_subtotal (0.0 to 50.0)

Respond ONLY with a JSON object matching this exact schema:
{
  "master_scores": {
    "case_comprehension": <number 0-5>,
    "role_persona": <number 0-5>,
    "constraints_control": <number 0-5>,
    "output_structuring": <number 0-5>,
    "strategic_depth": <number 0-5>,
    "prompt_technique": <number 0-5>
  },
  "master_subtotal": <number 0-30>,
  "bomb_scores": {
    "condition_adaptation": <number 0-5>,
    "surgical_precision": <number 0-5>,
    "objective_preservation": <number 0-5>,
    "adapted_execution_quality": <number 0-5>
  },
  "bomb_subtotal": <number 0-20>,
  "total_score": <number 0-50>,
  "key_strengths": "<2-3 sentences highlighting exceptional prompt engineering qualities>",
  "areas_for_improvement": "<1-2 actionable suggestions for optimization>",
  "verdict_summary": "<summary verdict on tournament readiness>"
}`;
}

// --- Normalizer & Sanitizer ---
function normalizeEvaluationPayload(raw) {
  const ms = raw.master_scores || {};
  const bs = raw.bomb_scores || {};

  const clamp = (val, max = 5) => Math.min(max, Math.max(0, Number(val) || 0));

  const comp = clamp(ms.case_comprehension);
  const persona = clamp(ms.role_persona);
  const constraints = clamp(ms.constraints_control);
  const struct = clamp(ms.output_structuring);
  const depth = clamp(ms.strategic_depth);
  const tech = clamp(ms.prompt_technique);

  const masterSubtotal = Math.round((comp + persona + constraints + struct + depth + tech) * 10) / 10;

  const adapt = clamp(bs.condition_adaptation);
  const surg = clamp(bs.surgical_precision);
  const obj = clamp(bs.objective_preservation);
  const exec = clamp(bs.adapted_execution_quality);

  const bombSubtotal = Math.round((adapt + surg + obj + exec) * 10) / 10;
  const totalScore = Math.round((masterSubtotal + bombSubtotal) * 10) / 10;

  return {
    master_scores: {
      case_comprehension: comp,
      role_persona: persona,
      constraints_control: constraints,
      output_structuring: struct,
      strategic_depth: depth,
      prompt_technique: tech
    },
    master_subtotal: masterSubtotal,
    bomb_scores: {
      condition_adaptation: adapt,
      surgical_precision: surg,
      objective_preservation: obj,
      adapted_execution_quality: exec
    },
    bomb_subtotal: bombSubtotal,
    total_score: totalScore,
    key_strengths: raw.key_strengths || "Comprehensive strategic prompt blueprint with clear system context.",
    areas_for_improvement: raw.areas_for_improvement || "Deepen negative constraints and milestone gating criteria.",
    verdict_summary: raw.verdict_summary || `Grand Finale Score: ${totalScore}/50 (Master Strategy: ${masterSubtotal}/30, Sabotage Adaptation: ${bombSubtotal}/20).`
  };
}

// --- Deterministic Semantic Rubric Engine (Fallback) ---
export function evaluateRound3WithHeuristics({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const masterText = (masterPrompt || "").trim();
  const adaptedText = (adaptedPrompt || masterText || "").trim();
  const masterLower = masterText.toLowerCase();
  const adaptedLower = adaptedText.toLowerCase();

  // Strict check for empty/short prompts
  if (masterText.length < 20 && adaptedText.length < 20) {
    return {
      master_scores: {
        case_comprehension: 0,
        role_persona: 0,
        constraints_control: 0,
        output_structuring: 0,
        strategic_depth: 0,
        prompt_technique: 0
      },
      master_subtotal: 0,
      bomb_scores: {
        condition_adaptation: 0,
        surgical_precision: 0,
        objective_preservation: 0,
        adapted_execution_quality: 0
      },
      bomb_subtotal: 0,
      total_score: 0,
      key_strengths: "No submission recorded.",
      areas_for_improvement: "Submit both Phase 1 Master Prompt and Phase 2 Bomb Adaptation to receive scores.",
      verdict_summary: "No valid prompt submitted (0/50)."
    };
  }

  // --- Part 1: Master Prompt Scores (30 pts max) ---
  let caseComp = 1.5;
  let rolePersona = 1.5;
  let constraintsCtrl = 1.5;
  let outputStruct = 1.5;
  let stratDepth = 1.5;
  let promptTech = 1.5;

  // 1. Case Comprehension & Fact Retention (Checking Case Specific Numbers & Keywords)
  const metrics = caseData?.scenario?.metrics || {};
  let metricMatches = 0;
  for (const [key, val] of Object.entries(metrics)) {
    const cleanVal = String(val).toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const numbers = String(val).match(/\d+/g) || [];
    if (numbers.some(num => masterText.includes(num)) || (cleanVal.length > 3 && masterLower.includes(cleanVal))) {
      metricMatches++;
    }
  }
  if (metricMatches >= 3) caseComp += 2.5;
  else if (metricMatches >= 1) caseComp += 1.5;
  if (masterText.length >= 250) caseComp += 1.0;

  // 2. Role Persona
  if (/(act as|you are|role:|chief|director|strategist|specialist|principal|architect|expert|lead consultant)/i.test(masterLower)) {
    rolePersona += 2.0;
  }
  if (/(tone:|voice:|authority|standpoint|perspective|mindset)/i.test(masterLower)) {
    rolePersona += 1.0;
  }
  if (/(executive|world-class|elite|senior)/i.test(masterLower)) {
    rolePersona += 0.5;
  }

  // 3. Constraints Control & Guardrails
  if (/(budget ceiling|timeline|strict|do not|avoid|must|mandatory|contingency|rules|limit|boundary|never)/i.test(masterLower)) {
    constraintsCtrl += 2.0;
  }
  if (/(negative constraint|guardrails|hallucination|verification|assumptions|forbidden)/i.test(masterLower)) {
    constraintsCtrl += 1.0;
  }
  if (masterText.length >= 350) constraintsCtrl += 0.5;

  // 4. Output Structuring
  if (/(table|markdown|gantt|matrix|sections|schema|columns|breakdown|roadmap|bullet points|json)/i.test(masterLower)) {
    outputStruct += 2.0;
  }
  if (/(1\.|2\.|3\.|phase 1|phase 2|phase 3|kpi|milestone)/i.test(masterLower)) {
    outputStruct += 1.0;
  }
  if (masterLower.includes('|') || masterLower.includes('```')) {
    outputStruct += 0.5;
  }

  // 5. Strategic Depth (Checking 5 Pillars Coverage)
  const pillars = caseData?.scenario?.requiredPillars || [];
  let pillarMatches = 0;
  for (const pillar of pillars) {
    const words = pillar.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 4);
    if (words.some(w => masterLower.includes(w))) {
      pillarMatches++;
    }
  }
  if (pillarMatches >= 4) stratDepth += 2.5;
  else if (pillarMatches >= 2) stratDepth += 1.5;
  if (masterText.length >= 500) stratDepth += 1.0;

  // 6. Prompt Engineering Technique
  if (/(<system>|<context>|<constraints>|few-shot|step-by-step|chain-of-thought|priority|delimiter|template)/i.test(masterLower)) {
    promptTech += 2.5;
  } else if (masterText.length >= 400) {
    promptTech += 1.5;
  }
  if (masterText.length >= 700) promptTech += 1.0;

  caseComp = Math.min(5.0, Math.round(caseComp * 10) / 10);
  rolePersona = Math.min(5.0, Math.round(rolePersona * 10) / 10);
  constraintsCtrl = Math.min(5.0, Math.round(constraintsCtrl * 10) / 10);
  outputStruct = Math.min(5.0, Math.round(outputStruct * 10) / 10);
  stratDepth = Math.min(5.0, Math.round(stratDepth * 10) / 10);
  promptTech = Math.min(5.0, Math.round(promptTech * 10) / 10);

  const masterSubtotal = Math.round((caseComp + rolePersona + constraintsCtrl + outputStruct + stratDepth + promptTech) * 10) / 10;

  // --- Part 2: Final Bomb Adaptation Scores (20 pts max) ---
  let condAdapt = 1.0;
  let surgPrec = 1.0;
  let objPres = 1.0;
  let execQual = 1.0;

  const isAdapted = adaptedText !== masterText && adaptedText.length > 30;

  if (isAdapted) {
    condAdapt += 1.5;
    surgPrec += 1.5;
    objPres += 2.0;
    execQual += 1.5;

    // Check specific sabotage impact keywords
    const impact = (bombData?.impactField || "").toLowerCase();
    const directiveLower = (bombData?.directive || "").toLowerCase();
    const headlineLower = (bombData?.headline || "").toLowerCase();

    // Check if directive/headline terms were captured in adapted draft
    const keyBombTerms = (directiveLower + " " + headlineLower).match(/[a-z0-9]{4,}/g) || [];
    let termMatches = keyBombTerms.filter(term => adaptedLower.includes(term)).length;

    if (termMatches >= 3) {
      condAdapt += 2.0;
      surgPrec += 1.5;
    } else if (termMatches >= 1) {
      condAdapt += 1.0;
      surgPrec += 1.0;
    }

    if (impact === 'budget' && /(3000|slashed|zero paid|organic|referral|growth hack|whatsapp|discord)/i.test(adaptedLower)) {
      condAdapt += 0.5;
    } else if (impact === 'timeline' && /(15 days|compressed|blitz|accelerated|fast track|urgent)/i.test(adaptedLower)) {
      condAdapt += 0.5;
    } else if (impact === 'audience' && /(alumni|working|developer|junior|industry|professionals)/i.test(adaptedLower)) {
      condAdapt += 0.5;
    }

    // Preservation of core structure
    if (adaptedText.length >= (masterText.length * 0.75)) {
      objPres += 1.5;
    }
    if (adaptedText.length > 250) {
      execQual += 1.0;
    }
  } else {
    // Unmodified prompt gets conservative baseline
    condAdapt = 1.5;
    surgPrec = 1.5;
    objPres = 3.0;
    execQual = 2.0;
  }

  condAdapt = Math.min(5.0, Math.round(condAdapt * 10) / 10);
  surgPrec = Math.min(5.0, Math.round(surgPrec * 10) / 10);
  objPres = Math.min(5.0, Math.round(objPres * 10) / 10);
  execQual = Math.min(5.0, Math.round(execQual * 10) / 10);

  const bombSubtotal = Math.round((condAdapt + surgPrec + objPres + execQual) * 10) / 10;
  const totalScore = Math.round((masterSubtotal + bombSubtotal) * 10) / 10;

  return {
    master_scores: {
      case_comprehension: caseComp,
      role_persona: rolePersona,
      constraints_control: constraintsCtrl,
      output_structuring: outputStruct,
      strategic_depth: stratDepth,
      prompt_technique: promptTech
    },
    master_subtotal: masterSubtotal,
    bomb_scores: {
      condition_adaptation: condAdapt,
      surgical_precision: surgPrec,
      objective_preservation: objPres,
      adapted_execution_quality: execQual
    },
    bomb_subtotal: bombSubtotal,
    total_score: totalScore,
    key_strengths: isAdapted
      ? "Strong strategic structure and rapid crisis adaptation. Successfully incorporated emergency constraints while maintaining core mission deliverables."
      : "Solid initial master strategy architecture; maintained core integrity.",
    areas_for_improvement: isAdapted
      ? "Include explicit parameter diff blocks and concrete contingency milestones for risk mitigation."
      : "Ensure active surgical injection of the emergency sabotage directive during the crisis window.",
    verdict_summary: `Grand Finale Score: ${totalScore}/50 (Master Strategy: ${masterSubtotal}/30, Sabotage Adaptation: ${bombSubtotal}/20). Highly competitive tournament performance!`
  };
}
