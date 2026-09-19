import { generateGeminiContent } from './geminiClient.js';

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
  if (process.env.GROQ_API_KEY) {
    try {
      const liveResult = await runGroqSandbox({ round, challengeType, prompt, testInput, contextData });
      if (liveResult) {
        return {
          ...liveResult,
          latencyMs: Date.now() - startTime,
          mode: 'LIVE_GROQ_AI'
        };
      }
    } catch (err) {
      console.warn(`[Sandbox] Live Groq failed: ${err.message}. Trying next provider...`);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const liveResult = await runGeminiSandbox({ round, challengeType, prompt, testInput, contextData });
      if (liveResult) {
        return {
          ...liveResult,
          latencyMs: Date.now() - startTime,
          mode: 'LIVE_GEMINI_AI'
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

async function runGroqSandbox({ round, challengeType, prompt, testInput, contextData }) {
  let systemDirective = "You are an AI model responding to the following system/user prompt crafted in a prompt engineering tournament.";
  let userQuery = testInput || "Execute the instructions in the prompt directly and provide high quality sample output.";

  if (round === 1) {
    systemDirective = `Execute this prompt accurately as designed:\nPROMPT:\n${prompt}\n\nProduce high-quality, structured output adhering to all constraints.`;
  } else if (round === 2 && challengeType === 'image') {
    systemDirective = `Analyze this image generation prompt:\n"${prompt}"\nProvide a vivid descriptive scene preview, photography breakdown, rendering engine parameters, and lighting profile.`;
  } else if (round === 2 && challengeType === 'report') {
    systemDirective = `Execute this structured report prompt:\n"${prompt}"\nProduce the complete markdown report with tables, headers, and metrics.`;
  } else if (round === 3) {
    systemDirective = `You are executing a Master Strategy Prompt:\n"${prompt}"\nContext: ${contextData?.title || 'Crisis Strategy'}.\nGenerate the structured multi-pillar plan.`;
  }

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
          messages: [
            { role: "system", content: systemDirective },
            { role: "user", content: userQuery }
          ],
          max_tokens: 1200,
          temperature: 0.4
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq model ${model} HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const outputText = data.choices?.[0]?.message?.content || "";
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
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Groq sandbox execution failed.");
}

async function runGeminiSandbox({ round, challengeType, prompt, testInput, contextData }) {
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

  const promptToSend = `${systemDirective}\n\nInput Context / Test Query: ${userQuery}`;
  const rawText = await generateGeminiContent({ prompt: promptToSend, jsonMode: false, temperature: 0.4 });
  const outputText = typeof rawText === 'string' ? rawText : JSON.stringify(rawText, null, 2);
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
    const hasTable = promptLower.includes('table') || promptLower.includes('markdown') || promptLower.includes('schema') || promptLower.includes('columns');

    if (genre === 'CREATIVE' || genre.includes('ARTS')) {
      outputText = `### 🎬 Video Script & Campaign Creative Brief\n\n`;
      outputText += `**Target Audience:** Undergraduate Students (Ages 18-24)\n`;
      outputText += `**Tone:** Vibrant, high-energy, memorable\n\n`;
      if (hasTable) {
        outputText += `| Time (sec) | Visual Scene Description | Audio Voiceover & SFX |\n`;
        outputText += `| :--- | :--- | :--- |\n`;
        outputText += `| **0:00 - 0:08** | Fast-paced neon glitch cuts of coding hackathon, robot arenas, and crowded auditorium | *[Bass Drop]* "Think you have what it takes to dominate the terminal?" |\n`;
        outputText += `| **0:08 - 0:22** | Close-ups of intense student teams collaborating, live leaderboard tickers ticking | "3 days. 50+ universities. ₹1,00,000 in grand prizes." |\n`;
        outputText += `| **0:22 - 0:30** | Dynamic 3D festival logo reveal with glowing registration URL and QR code | "PROMPT WARS 2026. Register your squad before spots fill up!" |\n\n`;
      } else {
        outputText += `**Hook (0:00 - 0:08):** "3 Days of pure engineering adrenaline. Are you ready to claim the championship?"\n\n`;
        outputText += `**Core Pitch (0:08 - 0:22):** Compete against the top developer minds across 5 intense hack tracks. Experience live DJ stages, networking masterclasses, and ₹1,00,000 in tech bounties.\n\n`;
        outputText += `**Call-To-Action (0:22 - 0:30):** "Registration is now open. Lock in your team passes today."\n\n`;
      }
      outputText += `**Campaign Tagline:** *"Build Beyond Limits. Conquer the Arena."*`;
    } 
    else if (genre === 'CODING' || genre.includes('DATA')) {
      outputText = `### 💻 Technical Implementation & Architecture Specification\n\n`;
      outputText += `\`\`\`python\n`;
      outputText += `import asyncio\nimport time\nfrom typing import Optional, Dict\n\nclass RateLimiter:\n`;
      outputText += `    """Thread-safe Token Bucket Rate Limiter with Redis backend."""\n`;
      outputText += `    def __init__(self, rate: int = 10, per: float = 1.0):\n`;
      outputText += `        self.rate = rate\n        self.per = per\n        self.allowance = rate\n        self.last_check = time.time()\n\n`;
      outputText += `    async def acquire(self) -> bool:\n`;
      outputText += `        now = time.time()\n        elapsed = now - self.last_check\n        self.last_check = now\n        self.allowance += elapsed * (self.rate / self.per)\n`;
      outputText += `        if self.allowance > self.rate:\n            self.allowance = self.rate\n`;
      outputText += `        if self.allowance < 1.0:\n            return False\n        self.allowance -= 1.0\n        return True\n\`\`\`\n\n`;
      outputText += `**Key Guarantees:** 100% async non-blocking execution, O(1) memory overhead, explicit timeout failover.`;
    }
    else {
      // Business / Marketing / Real-World
      outputText = `### 📊 Strategic Executive Brief & Action Plan\n\n`;
      outputText += `**Strategic Objective:** High-impact execution with measurable conversion metrics and risk mitigation.\n\n`;
      if (hasTable) {
        outputText += `| Phase / Milestone | Target Metric | Deliverable & Channel |\n`;
        outputText += `| :--- | :--- | :--- |\n`;
        outputText += `| **Phase 1: Blitz Teaser** | 5,000+ Reach | Campus ambassador network & short-form video |\n`;
        outputText += `| **Phase 2: Lead Acquisition** | 22% Conversion | Referral incentive loops with milestone badges |\n`;
        outputText += `| **Phase 3: Event Retention** | 94% Show-up Rate | Automated WhatsApp reminders & digital check-in |\n\n`;
      } else {
        outputText += `• **Pillar 1: Audience Segmentation:** Targeted outreach to technical student leads.\n`;
        outputText += `• **Pillar 2: Guerrilla Growth:** Campus squad referral mechanics with viral leaderboards.\n`;
        outputText += `• **Pillar 3: Contingency Safeguards:** 20% budget reserve buffer with secondary venue failover.\n\n`;
      }
      outputText += `**Projected ROI:** 3.4x organic amplification with 0% paid advertising burn.`;
    }
  } 
  else if (round === 2 && challengeType === 'image') {
    outputText = `### 🎨 Photorealistic Visual Specification Preview\n\n`;
    outputText += `• **Core Subject:** ${contextData?.title || 'Architectural Futuristic Cybernetic Structure'}\n`;
    outputText += `• **Camera Perspective:** Wide-angle 24mm f/1.8 cinematic perspective, sharp focal depth\n`;
    outputText += `• **Lighting Atmosphere:** Dramatic dual-tone volumetric lighting (Emerald Neon & Warm Gold rim light)\n`;
    outputText += `• **Rendering Parameters:** 8K Octane Render, hyper-detailed reflections, ray-traced subsurface scattering`;
  } 
  else if (round === 2 && challengeType === 'report') {
    outputText = `# EXECUTIVE FINANCIAL & PERFORMANCE REPORT\n\n`;
    outputText += `## 1. Operating Financial Performance\n\n`;
    outputText += `| Fiscal Quarter | Total Revenue | ARR Growth (%) | Gross Margin | Status |\n`;
    outputText += `| :--- | :--- | :--- | :--- | :--- |\n`;
    outputText += `| **Q1 2025** | $12.4M | +28.4% | 78.2% | Exceeded |\n`;
    outputText += `| **Q2 2025** | $14.8M | +31.2% | 80.5% | Target Hit |\n`;
    outputText += `| **Q3 2025** | $17.1M | +34.0% | 82.1% | Scaled |\n`;
    outputText += `| **Q4 2025** | $21.5M | +38.5% | 84.6% | High Growth |\n\n`;
    outputText += `## 2. Key Unit Economics & Runway\n`;
    outputText += `• **CAC Payback Period:** 5.2 Months\n`;
    outputText += `• **Net Retention Rate:** 128%\n`;
    outputText += `• **Capital Runway:** 34 Months at current operating burn`;
  } 
  else if (round === 3) {
    outputText = `## Grand Finale Master Strategy Blueprint: ${contextData?.title || 'Operational Growth Plan'}\n\n`;
    outputText += `### 1. Target Audience & Student Persona Architecture\n`;
    outputText += `High-intent engineering leads engaged through gamified team tracks and hands-on developer workshops.\n\n`;
    outputText += `### 2. Zero-Cost Viral Mechanics\n`;
    outputText += `• Squad referral incentives with instant Discord role unlocks.\n`;
    outputText += `• High-energy teaser reels distributed across 25+ campus WhatsApp groups.\n\n`;
    outputText += `### 3. Granular Budget & Milestone Allocation\n`;
    outputText += `| Milestone | Budget Allocation | Expected Output |\n`;
    outputText += `| :--- | :--- | :--- |\n`;
    outputText += `| **Community Activation** | 45% (₹6,750) | 400+ Verified Registrations |\n`;
    outputText += `| **Visual Collateral** | 25% (₹3,750) | 10k Organic Impressions |\n`;
    outputText += `| **Contingency Buffer** | 30% (₹4,500) | Zero-risk execution buffer |\n\n`;
    outputText += `### 4. Contingency & Crisis Protocols\n`;
    outputText += `Dynamic capacity tracking with automated waitlists and secondary server failover.`;
  }

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
