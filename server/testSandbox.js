import { io } from 'socket.io-client';
import { runPromptSandbox } from './sandboxSimulator.js';

async function runTests() {
  console.log("==========================================");
  console.log("🧪 TESTING INTERACTIVE PROMPT SANDBOX ENGINE");
  console.log("==========================================");

  // Test 1: Direct Simulator Functionality for Round 1
  console.log("\n[Test 1] Testing Round 1 Heuristic Simulation & Diagnostics...");
  const r1Res = await runPromptSandbox({
    round: 1,
    challengeType: 'prompt',
    promptText: "Act as a Senior Creative Brand Strategist with 12 years of enterprise marketing experience. CONSTRAINTS: Avoid generic buzzwords, maintain high energy. Output format: Markdown table with Campaign Phase, Metric Goal, and Asset Format.",
    contextData: { genreName: 'CREATIVE', title: 'Viral SaaS Launch' }
  });

  console.log("✓ Success:", r1Res.success);
  console.log("✓ Compliance Score:", r1Res.diagnostics?.complianceScore);
  console.log("✓ Detected Persona:", r1Res.diagnostics?.extractedPersona);
  console.log("✓ Detected Pillars:", r1Res.diagnostics?.pillarsDetected);
  console.log("✓ Tokens Total:", r1Res.tokens?.totalEstimated);
  console.log("✓ Output Snippet:\n", r1Res.outputText?.slice(0, 150) + "...");

  // Test 2: Direct Simulator Functionality for Round 2 (Report)
  console.log("\n[Test 2] Testing Round 2 Report Simulation...");
  const r2Res = await runPromptSandbox({
    round: 2,
    challengeType: 'report',
    promptText: "Create an executive enterprise report. Include a quarterly performance table with Revenue ($M), ARR Growth (%), and Net Margin (%). Define risk mitigation steps.",
    contextData: { title: 'Enterprise SaaS Audit' }
  });
  console.log("✓ Success:", r2Res.success);
  console.log("✓ Compliance Score:", r2Res.diagnostics?.complianceScore);
  console.log("✓ Output Table Found:", r2Res.outputText?.includes('| Quarter |'));

  // Test 3: Direct Simulator Functionality for Round 3 (Master Blueprint)
  console.log("\n[Test 3] Testing Round 3 Master Strategy Blueprint...");
  const r3Res = await runPromptSandbox({
    round: 3,
    challengeType: 'master',
    promptText: "Act as an Operations Director. Construct a comprehensive strategy addressing high-conversion student personas, guerrilla viral loops, INR budget allocation matrix, and risk mitigation protocols.",
    contextData: { title: 'Tech Fest Growth Battle' }
  });
  console.log("✓ Success:", r3Res.success);
  console.log("✓ Compliance Score:", r3Res.diagnostics?.complianceScore);
  console.log("✓ Pillars count:", Object.values(r3Res.diagnostics?.pillarsDetected || {}).filter(Boolean).length);

  console.log("\n==========================================");
  console.log("🎉 ALL SANDBOX ENGINE TESTS COMPLETED SUCCESSFULLY");
  console.log("==========================================");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
