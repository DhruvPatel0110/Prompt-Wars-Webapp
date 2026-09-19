import { evaluateRound2Prompt } from './evaluatorRound2.js';

const targetChallenge = {
  id: "r2_img_01",
  title: "Neon Cyberpunk Assassin in Rainy Alley",
  description: "A cinematic, low-angle digital concept art of a cybernetic warrior standing in a rain-drenched Neo-Tokyo alleyway illuminated by vibrant pink, purple, and electric cyan neon kanji signs, with wet asphalt reflections and atmospheric steam.",
  keyElements: [
    "Cyberpunk warrior with glowing cybernetic implants and visor",
    "Rain-slicked asphalt with vivid neon pink and cyan reflections",
    "Dense vertical holographic kanji billboards and neon signs",
    "Cinematic low-angle perspective with anamorphic lens flare",
    "Atmospheric volumetric rain particles and rising steam"
  ],
  targetVisualPrompt: "Cinematic low-angle digital concept art of a futuristic cyberpunk assassin standing in a narrow rain-soaked alley in Neo-Tokyo at night. Dressed in tactical carbon-fiber techwear with glowing crimson ocular implants and a holographic katana. The ground is wet glossy asphalt reflecting vibrant pink, purple, and turquoise kanji neon signs. Heavy volumetric rain, floating atmospheric steam, anamorphic lens flares, Unreal Engine 5 render, 8k resolution, photorealistic cinematic lighting.",
  evaluationCriteria: {
    composition: "Low-angle cinematic perspective, vertical framing of towering alley walls",
    colors: "Noir shadow palette with intense neon pink, cyan, and glowing crimson highlights",
    subject: "Cybernetic tactical warrior in cyberpunk alley with weapons/techwear",
    style: "Cinematic sci-fi digital concept art, raytraced reflections, volumetric rain"
  }
};

async function runEvaluatorQualityTests() {
  console.log("==========================================================================");
  console.log("🧪 TESTING ROUND 2 EVALUATOR CALIBRATION & SIMILARITY SCORING");
  console.log("==========================================================================\n");

  // Test 1: Null / Empty Prompt
  console.log("1️⃣ Testing Null / Empty Prompt...");
  const r1 = await evaluateRound2Prompt({ assignedChallenge: targetChallenge, studentPrompt: "" });
  console.log(`   Score: ${r1.total_score}/20 | Comp: ${r1.composition_score}, Colors: ${r1.colors_score}, Subj: ${r1.subject_score}, Style: ${r1.style_score}`);
  console.log(`   Reasoning: ${r1.reasoning}`);
  if (r1.total_score !== 0) throw new Error(`Expected 0 for empty prompt, got ${r1.total_score}`);
  console.log("   ✅ PASSED: Empty prompt received exactly 0/20\n");

  // Test 2: "No prompt submitted yet."
  console.log("2️⃣ Testing 'No prompt submitted yet.' string...");
  const r2 = await evaluateRound2Prompt({ assignedChallenge: targetChallenge, studentPrompt: "No prompt submitted yet." });
  console.log(`   Score: ${r2.total_score}/20`);
  if (r2.total_score !== 0) throw new Error(`Expected 0 for placeholder, got ${r2.total_score}`);
  console.log("   ✅ PASSED: Placeholder string received exactly 0/20\n");

  // Test 3: Completely Off-Topic Prompt (e.g. Cooking recipe)
  console.log("3️⃣ Testing Completely Off-Topic Prompt ('Delicious Italian Margherita Pizza with basil and mozzarella')...");
  const r3 = await evaluateRound2Prompt({ assignedChallenge: targetChallenge, studentPrompt: "A delicious Italian Margherita pizza fresh from a wood-fired oven with melted mozzarella cheese, fresh basil leaves, and tomato sauce on a rustic wooden table." });
  console.log(`   Score: ${r3.total_score}/20 | Comp: ${r3.composition_score}, Colors: ${r3.colors_score}, Subj: ${r3.subject_score}, Style: ${r3.style_score}`);
  console.log(`   Reasoning: ${r3.reasoning}`);
  if (r3.total_score > 3.0) throw new Error(`Expected <= 3.0 for completely off-topic prompt, got ${r3.total_score}`);
  console.log("   ✅ PASSED: Off-topic prompt correctly penalized (< 3.0/20)\n");

  // Test 4: Partial Generic Prompt
  console.log("4️⃣ Testing Partial Prompt ('A person in a city street with lights at night')...");
  const r4 = await evaluateRound2Prompt({ assignedChallenge: targetChallenge, studentPrompt: "A person standing in a dark city street at night with some neon lights, realistic style." });
  console.log(`   Score: ${r4.total_score}/20 | Comp: ${r4.composition_score}, Colors: ${r4.colors_score}, Subj: ${r4.subject_score}, Style: ${r4.style_score}`);
  console.log(`   Reasoning: ${r4.reasoning}`);
  if (r4.total_score < 4.0 || r4.total_score > 11.0) throw new Error(`Expected 4-11 for partial prompt, got ${r4.total_score}`);
  console.log("   ✅ PASSED: Partial prompt received moderate score\n");

  // Test 5: High-Fidelity Reverse-Engineered Prompt
  console.log("5️⃣ Testing High-Fidelity Master Prompt...");
  const highFidelityPrompt = "Low-angle cinematic digital concept art of a cybernetic warrior assassin standing in a dark, narrow alley in Neo-Tokyo during heavy rain. Dressed in tactical cyberpunk techwear with glowing visor and implants. Wet asphalt ground with intense pink and cyan neon kanji reflections and rising volumetric steam. Unreal Engine 5 render, 8k resolution, raytraced reflections, dramatic noir lighting.";
  const r5 = await evaluateRound2Prompt({ assignedChallenge: targetChallenge, studentPrompt: highFidelityPrompt });
  console.log(`   Score: ${r5.total_score}/20 | Comp: ${r5.composition_score}, Colors: ${r5.colors_score}, Subj: ${r5.subject_score}, Style: ${r5.style_score}`);
  console.log(`   Reasoning: ${r5.reasoning}`);
  console.log(`   Matched Elements:`, r5.matched_elements);
  console.log(`   Missed Elements:`, r5.missed_elements);
  if (r5.total_score < 15.0) throw new Error(`Expected >= 15.0 for high fidelity prompt, got ${r5.total_score}`);
  console.log("   ✅ PASSED: High fidelity prompt received high score (>= 15/20)\n");

  console.log("==========================================================================");
  console.log("🎉 ALL ROUND 2 EVALUATOR QUALITY & CALIBRATION TESTS PASSED!");
  console.log("==========================================================================");
}

runEvaluatorQualityTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
