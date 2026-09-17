/**
 * Interactive Prompt Sandbox Simulation Engine for PROMPT WARS
 * Enables real-time prompt testing, LLM generation previews, token diagnostics,
 * structural compliance analysis, and actionable refinement feedback.
 */

export async function runPromptSandbox({
  round = 1,
  challengeType = 'prompt',
  promptText = '',
  testInput = '',
  contextData = {},
  teamName = 'Team'
}) {
  const startTime = Date.now();
  const prompt = (promptText || '').trim();

  if (!prompt || prompt.length < 10) {
    return {
      success: false,
      error: 'Prompt is too short to run in sandbox (minimum 10 characters required).'
    };
  }

  // 1. Check live LLM keys for actual generation if configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const liveResult = await runGeminiSandbox({ round, challengeType, prompt, testInput, contextData });
      if (liveResult) {
        return {
          ...liveResult,
          latencyMs: Date.now() - startTime,
          mode: 'LIVE_GEMINI_1.5_FLASH'
        };
      }
    } catch (err) {
      console.warn(`[Sandbox] Live Gemini failed: ${err.message}. Using intelligent simulator.`);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const liveResult = await runOpenAISandbox({ round, challengeType, prompt, testInput, contextData });
      if (liveResult) {
        return {
          ...liveResult,
          latencyMs: Date.now() - startTime,
          mode: 'LIVE_GPT_4O_MINI'
        };
      }
    } catch (err) {
      console.warn(`[Sandbox] Live OpenAI failed: ${err.message}. Using intelligent simulator.`);
    }
  }

  // 2. Intelligent Heuristic Sandbox Simulator (Instant, offline-resilient, deterministic)
  const simulationResult = simulateHeuristicOutput({
    round,
    challengeType,
    prompt,
    testInput,
    contextData,
    teamName
  });

  return {
    ...simulationResult,
    latencyMs: Math.max(120, Date.now() - startTime + Math.floor(Math.random() * 180 + 150)),
    mode: 'INTELLIGENT_SIMULATOR'
  };
}

// -------------------------------------------------------------
// LIVE LLM EXECUTIONS
// -------------------------------------------------------------

async function runGeminiSandbox({ round, challengeType, prompt, testInput, contextData }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  let systemDirective = "You are an AI model responding to the following system/user prompt crafted in a prompt engineering tournament.";
  let userQuery = testInput || "Generate standard sample execution based on this prompt instructions.";

  if (round === 1) {
    systemDirective = `Execute this prompt accurately as designed:\nPROMPT:\n${prompt}\n\nProduce high-quality, structured output adhering to all constraints.`;
  } else if (round === 2 && challengeType === 'image') {
    systemDirective = `Analyze this image generation prompt:\n"${prompt}"\nProvide a vivid descriptive scene preview, photography breakdown, rendering engine parameters, and lighting profile.`;
  } else if (round === 2 && challengeType === 'report') {
    systemDirective = `Execute this structured report prompt:\n"${prompt}"\nProduce the complete markdown report with tables, headers, and metrics.`;
  } else if (round === 3) {
    systemDirective = `You are executing a Master Strategy Prompt:\n"${prompt}"\nContext: ${contextData?.title || 'Crisis Strategy'}.\nGenerate the structured multi-pillar plan.`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemDirective}\n\nInput Context / Test Query: ${userQuery}` }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800
      }
    })
  });

  if (!response.ok) return null;

  const data = await response.json();
  const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  const diagnostics = analyzePromptDiagnostics(prompt, round, challengeType);

  return {
    success: true,
    outputText,
    diagnostics,
    tokens: {
      inputEstimated: Math.round(prompt.length / 4),
      outputEstimated: Math.round(outputText.length / 4),
      totalEstimated: Math.round((prompt.length + outputText.length) / 4)
    }
  };
}

async function runOpenAISandbox({ round, challengeType, prompt, testInput, contextData }) {
  let systemContent = "You are executing a user-crafted prompt in an interactive prompt testing sandbox. Follow all rules, formatting, and personas.";
  let userContent = testInput || `Execute the following prompt instructions in full:\n\n${prompt}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent }
      ],
      max_tokens: 800,
      temperature: 0.4
    })
  });

  if (!response.ok) return null;

  const data = await response.json();
  const outputText = data.choices?.[0]?.message?.content || "No response generated.";
  const diagnostics = analyzePromptDiagnostics(prompt, round, challengeType);

  return {
    success: true,
    outputText,
    diagnostics,
    tokens: {
      inputEstimated: data.usage?.prompt_tokens || Math.round(prompt.length / 4),
      outputEstimated: data.usage?.completion_tokens || Math.round(outputText.length / 4),
      totalEstimated: data.usage?.total_tokens || Math.round((prompt.length + outputText.length) / 4)
    }
  };
}

// -------------------------------------------------------------
// HEURISTIC SIMULATOR & DIAGNOSTIC ANALYZER
// -------------------------------------------------------------

function simulateHeuristicOutput({ round, challengeType, prompt, testInput, contextData, teamName }) {
  const diagnostics = analyzePromptDiagnostics(prompt, round, challengeType);
  const promptLower = prompt.toLowerCase();

  let outputText = "";

  if (round === 1) {
    const genre = (contextData?.genreName || "CREATIVE").toUpperCase();
    const hasTable = promptLower.includes('table') || promptLower.includes('markdown') || promptLower.includes('schema');
    const hasPersona = diagnostics.pillarsDetected.persona;

    outputText = `### 🌟 [Sandbox Simulation Response - Round 1: ${genre}]\n\n`;
    if (hasPersona) {
      outputText += `> **Persona Activated:** Executive Specialist (${diagnostics.extractedPersona || 'Senior Domain Expert'})\n\n`;
    }

    outputText += `#### Executive Campaign & Strategic Deliverable\n`;
    outputText += `Based on your prompt constraints, here is the generated output:\n\n`;
    outputText += `1. **Core Value Proposition:** High-impact engagement driven by targeted storytelling and clear call-to-action.\n`;
    outputText += `2. **Audience Hook:** "Transforming legacy limitations into automated, precision-crafted results."\n\n`;

    if (hasTable) {
      outputText += `| Phase / Channel | Target Metric | Deliverable & Output Format |\n`;
      outputText += `| :--- | :--- | :--- |\n`;
      outputText += `| **Launch (Days 1-7)** | 4,500 Impressions | Short-form dynamic hero hook |\n`;
      outputText += `| **Engagement (Days 8-20)** | 18% Conversion Rate | Deep-dive comparative table |\n`;
      outputText += `| **Closing (Days 21-30)** | 92% NPS Satisfaction | Actionable next-step workflow |\n\n`;
    }

    outputText += `#### Constraints Adherence Verification:\n`;
    outputText += `• **Negative Constraints:** ${diagnostics.pillarsDetected.negativeRules ? '✓ Successfully avoided clichés and generic filler' : '⚠️ Prompt lacked explicit negative exclusions'}\n`;
    outputText += `• **Tone & Polish:** ${diagnostics.pillarsDetected.tone ? '✓ Professional, engaging, and explicit' : 'Neutral default tone'}\n`;
  } 
  else if (round === 2 && challengeType === 'image') {
    outputText = `### 🎨 [Visual Synthesis Simulation - Midjourney / DALL-E 3]\n\n`;
    outputText += `**Prompt Interpretation:**\n`;
    outputText += `* **Subject Core:** ${contextData?.title || 'Target Architectural / Futuristic Scene'}\n`;
    outputText += `* **Lighting & Atmosphere:** ${promptLower.includes('golden hour') || promptLower.includes('sunset') ? 'Warm golden hour sunset with volumetric rays' : promptLower.includes('neon') || promptLower.includes('cyber') ? 'High-contrast neon glow with reflections' : 'Cinematic studio high-key illumination'}\n`;
    outputText += `* **Camera & Lens:** ${promptLower.includes('wide') || promptLower.includes('8k') || promptLower.includes('octane') ? 'Wide-angle 24mm f/1.8, 8k hyper-detailed Octane Render' : 'Standard 50mm perspective render'}\n`;
    outputText += `* **Color Palette:** ${promptLower.includes('emerald') || promptLower.includes('cyan') || promptLower.includes('gold') ? 'Curated dual-tone cyberpunk palette (Cyan, Gold, Emerald)' : 'Vibrant dynamic range'}\n\n`;
    outputText += `> **Simulated Image Engine Verdict:** Prompt clarity index is **${diagnostics.complianceScore}%**. Visual tokens correspond accurately to key target elements.`;
  } 
  else if (round === 2 && challengeType === 'report') {
    outputText = `### 📊 [Simulated Target Report Generation]\n\n`;
    outputText += `# EXECUTIVE SUMMARY REPORT\n\n`;
    outputText += `## 1. Overview & Core Performance Indicators\n`;
    outputText += `Operating performance demonstrates strong retention and optimized expense management.\n\n`;
    outputText += `| Quarter | Revenue ($M) | ARR Growth (%) | Net Margin (%) | Status |\n`;
    outputText += `| :--- | :--- | :--- | :--- | :--- |\n`;
    outputText += `| Q1 2025 | $12.4M | +28.4% | 22.1% | Exceeded |\n`;
    outputText += `| Q2 2025 | $14.8M | +31.2% | 24.5% | Target Hit |\n`;
    outputText += `| Q3 2025 | $17.1M | +34.0% | 26.8% | Scaled |\n`;
    outputText += `| Q4 2025 | $21.5M | +38.5% | 29.2% | High Growth |\n\n`;
    outputText += `## 2. Key Strategic Risk Mitigation\n`;
    outputText += `• **Customer Churn Rate:** Reduced to 1.8% through proactive SLA automation.\n`;
    outputText += `• **Operational Runway:** 32 Months reserve capital at current burn rate.\n`;
  } 
  else if (round === 3) {
    const isCrisis = challengeType === 'bomb' || promptLower.includes('emergency') || promptLower.includes('budget');
    outputText = `### 🏆 [Master Strategy Blueprint Simulation - Round 3]\n\n`;
    if (isCrisis) {
      outputText += `> 🚨 **EMERGENCY CONTINGENCY PIVOT DETECTED:**\n`;
      outputText += `> Budget & constraints adapted. Zero-cost viral growth mechanics and guerrilla outreach prioritized.\n\n`;
    }

    outputText += `## Strategic Execution Plan: ${contextData?.title || 'Operational Growth Battle'}\n\n`;
    outputText += `### Pillar 1: High-Conversion Student & User Personas\n`;
    outputText += `Targeting high-intent engineering leads with tailored messaging across tech tracks and gamified prize pools.\n\n`;
    outputText += `### Pillar 2: Guerrilla Growth & Zero-Cost Viral Loops\n`;
    outputText += `• Peer-to-peer Discord squad ticket mechanics with automated referral leaderboard.\n`;
    outputText += `• High-energy teaser reels distributed via campus ambassador networks.\n\n`;
    outputText += `### Pillar 3: Granular Resource Allocation\n`;
    outputText += `| Category | Resource Allocation | Impact Metric |\n`;
    outputText += `| :--- | :--- | :--- |\n`;
    outputText += `| Community Incentives | 45% Share | 450+ Verified Signups |\n`;
    outputText += `| High-Impact Visuals | 25% Share | 12k Organic Views |\n`;
    outputText += `| Contingency Reserve | 30% Share | Risk Buffer Protection |\n\n`;
    outputText += `### Pillar 4: Risk Mitigation & Failover Protocols\n`;
    outputText += `Real-time registration tracking with dynamic milestone unlocks at 25%, 50%, and 100% capacity thresholds.\n`;
  }

  const estimatedInputTokens = Math.round(prompt.length / 4);
  const estimatedOutputTokens = Math.round(outputText.length / 4);

  return {
    success: true,
    outputText,
    diagnostics,
    tokens: {
      inputEstimated: estimatedInputTokens,
      outputEstimated: estimatedOutputTokens,
      totalEstimated: estimatedInputTokens + estimatedOutputTokens
    }
  };
}

function analyzePromptDiagnostics(prompt, round, challengeType) {
  const p = prompt.toLowerCase();
  
  // Detection flags
  const hasPersona = /act as|you are|role:|persona:|expert|specialist|senior|architect/i.test(p);
  const hasConstraints = /constraint|rule|must not|avoid|limit|never|do not|boundary|strict/i.test(p);
  const hasNegativeRules = /avoid|do not|never|exclude|without|no generic|no fluff/i.test(p);
  const hasOutputFormat = /format|schema|markdown|table|json|structure|bullet|section|column/i.test(p);
  const hasTone = /tone|style|voice|concise|formal|authoritative|persuasive|energetic/i.test(p);
  const hasEdgeCases = /edge case|fallback|error|risk|mitigation|if fail|contingency/i.test(p);

  // Compute compliance score (0-100)
  let score = 40;
  if (hasPersona) score += 15;
  if (hasConstraints) score += 15;
  if (hasOutputFormat) score += 15;
  if (hasNegativeRules) score += 10;
  if (hasEdgeCases) score += 5;
  score = Math.min(100, Math.max(15, score));

  // Extract likely persona
  let extractedPersona = null;
  const personaMatch = prompt.match(/(?:act as|you are an?|role:)\s+([a-zA-Z\s]{4,35})(?:\.|\n|,|with)/i);
  if (personaMatch && personaMatch[1]) {
    extractedPersona = personaMatch[1].trim();
  }

  // Generate actionable tips
  const tips = [];
  if (!hasPersona) {
    tips.push("Add a specific role persona (e.g. 'Act as a Principal Growth Strategist...') to elevate tone.");
  }
  if (!hasNegativeRules) {
    tips.push("Include negative constraints (e.g. 'Do NOT use buzzwords or vague advice') for higher clarity points.");
  }
  if (!hasOutputFormat) {
    tips.push("Specify exact output format (e.g. 'Output as a Markdown table with columns: Metric, Target, Owner').");
  }
  if (!hasEdgeCases && round === 3) {
    tips.push("Include risk & contingency rules to maximize edge-case handling score.");
  }
  if (tips.length === 0) {
    tips.push("Excellent prompt architecture! Structure, persona, constraints, and schemas are well-calibrated.");
  }

  return {
    complianceScore: score,
    extractedPersona,
    pillarsDetected: {
      persona: hasPersona,
      constraints: hasConstraints,
      negativeRules: hasNegativeRules,
      outputFormat: hasOutputFormat,
      tone: hasTone,
      edgeCases: hasEdgeCases
    },
    tips
  };
}
