/**
 * AI Evaluator Engine for PROMPT WARS Round 3: Final Prompt Battle & Emergency Bomb Adaptation
 * Total: 50 Points (30 pts Master Prompt + 20 pts Final Bomb Adaptation)
 */

export async function evaluateRound3Submission({ caseData, bombData, masterPrompt, adaptedPrompt, teamName }) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await evaluateRound3WithAnthropic({ caseData, bombData, masterPrompt, adaptedPrompt });
    } catch (err) {
      console.warn(`[Round3 Evaluator] Anthropic API failed (${err.message}). Falling back.`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateRound3WithGemini({ caseData, bombData, masterPrompt, adaptedPrompt });
    } catch (err) {
      console.warn(`[Round3 Evaluator] Gemini API failed (${err.message}). Falling back.`);
    }
  }

  return evaluateRound3WithHeuristics({ caseData, bombData, masterPrompt, adaptedPrompt });
}

// --- Anthropic Claude Evaluator ---
async function evaluateRound3WithAnthropic({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const prompt = `You are the Supreme AI Adjudicator for PROMPT WARS ROUND 3: GRAND FINALE.

CASE STUDY:
Title: ${caseData.title}
Context: ${caseData.scenario?.context}
Metrics: ${JSON.stringify(caseData.scenario?.metrics || {})}
Required Strategic Pillars: ${JSON.stringify(caseData.scenario?.requiredPillars || [])}

INJECTED FINAL BOMB:
Headline: ${bombData.headline}
Description: ${bombData.description}
Directive: ${bombData.directive}

TEAM RESPONSES:
Phase 1 Master Prompt:
"""${masterPrompt || ""}"""

Phase 2 Adapted Prompt (Post-Bomb):
"""${adaptedPrompt || masterPrompt || ""}"""

EVALUATE ON 50-POINT RUBRIC:
Part 1: Master Prompt (30 pts):
1. case_comprehension (0-5)
2. role_persona (0-5)
3. constraints_control (0-5)
4. output_structuring (0-5)
5. strategic_depth (0-5)
6. prompt_technique (0-5)
master_subtotal (0-30)

Part 2: Final Bomb Adaptation (20 pts):
7. condition_adaptation (0-5)
8. surgical_precision (0-5)
9. objective_preservation (0-5)
10. adapted_execution_quality (0-5)
bomb_subtotal (0-20)

total_score (0-50), key_strengths, areas_for_improvement, verdict_summary.

Respond ONLY with valid JSON matching this schema:
{
  "master_scores": {
    "case_comprehension": 4.8,
    "role_persona": 4.5,
    "constraints_control": 4.5,
    "output_structuring": 4.7,
    "strategic_depth": 4.6,
    "prompt_technique": 4.4
  },
  "master_subtotal": 27.5,
  "bomb_scores": {
    "condition_adaptation": 4.7,
    "surgical_precision": 4.5,
    "objective_preservation": 4.6,
    "adapted_execution_quality": 4.7
  },
  "bomb_subtotal": 18.5,
  "total_score": 46.0,
  "key_strengths": "<string>",
  "areas_for_improvement": "<string>",
  "verdict_summary": "<string>"
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
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);
  const data = await response.json();
  const rawText = data.content?.[0]?.text || "{}";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
}

// --- Gemini Evaluator ---
async function evaluateRound3WithGemini({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are the Supreme AI Adjudicator for PROMPT WARS ROUND 3: GRAND FINALE.
Case: ${caseData.title}
Bomb: ${bombData.headline} - ${bombData.description}
Master Prompt: "${masterPrompt}"
Adapted Prompt: "${adaptedPrompt || masterPrompt}"

Evaluate on 50-point rubric:
master_scores: case_comprehension, role_persona, constraints_control, output_structuring, strategic_depth, prompt_technique (each 0-5).
master_subtotal (0-30).
bomb_scores: condition_adaptation, surgical_precision, objective_preservation, adapted_execution_quality (each 0-5).
bomb_subtotal (0-20).
total_score (0-50), key_strengths, areas_for_improvement, verdict_summary.
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

// --- Deterministic Semantic Rubric Engine ---
export function evaluateRound3WithHeuristics({ caseData, bombData, masterPrompt, adaptedPrompt }) {
  const masterText = (masterPrompt || "").trim();
  const adaptedText = (adaptedPrompt || masterText || "").trim();
  const masterLower = masterText.toLowerCase();
  const adaptedLower = adaptedText.toLowerCase();

  // Part 1: Master Prompt Scores (30 pts)
  let caseComp = 2;
  let rolePersona = 2;
  let constraintsCtrl = 2;
  let outputStruct = 2;
  let stratDepth = 2;
  let promptTech = 2;

  // Case Comprehension & Fact Retention
  if (/(1000|800|350|15000|₹15,000|30 days|20 volunteers|120 scooters|50000|₹50,000|tier-2|engineering)/i.test(masterLower)) {
    caseComp += 2;
  }
  if (masterText.length >= 250) caseComp += 1;

  // Persona
  if (/(act as|you are|role:|chief|director|strategist|specialist|principal|architect|expert)/i.test(masterLower)) {
    rolePersona += 2;
  }
  if (/(tone:|voice:|authority|standpoint)/i.test(masterLower)) rolePersona += 1;

  // Constraints
  if (/(budget ceiling|timeline|strict|do not|avoid|must|mandatory|contingency|rules|limit)/i.test(masterLower)) {
    constraintsCtrl += 2;
  }
  if (masterText.length >= 350) constraintsCtrl += 1;

  // Output Structuring
  if (/(table|markdown|gantt|matrix|sections|schema|columns|breakdown|roadmap|bullet points)/i.test(masterLower)) {
    outputStruct += 2;
  }
  if (/(1\.|2\.|3\.|phase 1|phase 2|phase 3|kpi)/i.test(masterLower)) outputStruct += 1;

  // Strategic Depth
  if (/(personas|guerrilla|referral|ambassador|cac|conversion|funnel|roi|growth|viral)/i.test(masterLower)) {
    stratDepth += 2;
  }
  if (masterText.length >= 500) stratDepth += 1;

  // Prompt Technique
  if (/(<system>|<context>|<constraints>|few-shot|step-by-step|chain-of-thought|priority|weight)/i.test(masterLower) || masterText.length >= 400) {
    promptTech += 2;
  }
  if (masterText.length >= 700) promptTech += 1;

  caseComp = Math.min(5, Math.max(1, caseComp));
  rolePersona = Math.min(5, Math.max(1, rolePersona));
  constraintsCtrl = Math.min(5, Math.max(1, constraintsCtrl));
  outputStruct = Math.min(5, Math.max(1, outputStruct));
  stratDepth = Math.min(5, Math.max(1, stratDepth));
  promptTech = Math.min(5, Math.max(1, promptTech));

  const masterSubtotal = caseComp + rolePersona + constraintsCtrl + outputStruct + stratDepth + promptTech;

  // Part 2: Final Bomb Adaptation Scores (20 pts)
  let condAdapt = 1;
  let surgPrec = 1;
  let objPres = 1;
  let execQual = 1;

  const isAdapted = adaptedText !== masterText && adaptedText.length > 30;

  if (isAdapted) {
    condAdapt += 2;
    surgPrec += 2;
    objPres += 2;
    execQual += 2;

    // Check specific bomb adaptation keywords
    const impact = (bombData.impactField || "").toLowerCase();
    if (impact === 'budget' && /(3000|₹3,000|slashed|zero paid|organic|referral loop|growth hack|whatsapp)/i.test(adaptedLower)) {
      condAdapt += 2;
      surgPrec += 1;
    } else if (impact === 'timeline' && /(15 days|compressed|blitz|accelerated|fast track|urgent)/i.test(adaptedLower)) {
      condAdapt += 2;
      surgPrec += 1;
    } else if (impact === 'audience' && /(alumni|working|developer|junior|industry|professionals)/i.test(adaptedLower)) {
      condAdapt += 2;
      surgPrec += 1;
    } else if (/(override|crisis|emergency|adapted|pivot|reallocate)/i.test(adaptedLower)) {
      condAdapt += 1;
      surgPrec += 1;
    }

    if (adaptedText.length >= (masterText.length * 0.8)) objPres += 1;
    if (adaptedText.length > 200) execQual += 1;
  } else {
    // If unmodified during 30s window, default resilient score
    condAdapt = 2;
    surgPrec = 2;
    objPres = 3;
    execQual = 2;
  }

  condAdapt = Math.min(5, Math.max(1, condAdapt));
  surgPrec = Math.min(5, Math.max(1, surgPrec));
  objPres = Math.min(5, Math.max(1, objPres));
  execQual = Math.min(5, Math.max(1, execQual));

  const bombSubtotal = condAdapt + surgPrec + objPres + execQual;
  const totalScore = masterSubtotal + bombSubtotal;

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
      ? "Exceptional strategic blueprint! Swiftly adapted to the injected constraint without compromising the primary mission objective."
      : "Strong initial master strategy architecture; maintained core integrity.",
    areas_for_improvement: isAdapted
      ? "Could add even more granular timeline Gantt milestones for volunteer contingency allocation."
      : "Incorporate explicit parameter diff blocks during emergency bomb adaptation.",
    verdict_summary: `Grand Finale Score: ${totalScore}/50 (Master: ${masterSubtotal}/30, Bomb Adaptation: ${bombSubtotal}/20). Highly competitive tournament performance!`
  };
}
