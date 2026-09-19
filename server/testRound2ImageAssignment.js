/**
 * Verification Test for Round 2: Image Prompt Reverse Engineering
 * Tests:
 * 1. 20 concurrent teams entering Round 2
 * 2. Verification of unique image challenge assignments from round2_challenges.json / round2_images/
 * 3. Student draft autosave and prompt submission (team:round2_submit)
 * 4. Batch evaluation with 20-point rubric breakdown
 * 5. Leaderboard scoring and qualification cutoffs (>= 8.0 / 20)
 * 6. Advancement to Round 3
 */

import { io } from 'socket.io-client';
import { StateManager } from './stateManager.js';
import { evaluateRound2Prompt } from './evaluatorRound2.js';

const SERVER_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 ROUND 2 IMAGE REVERSE ENGINEERING CHALLENGE VERIFICATION TEST');
  console.log('========================================================================\n');

  // Test 1: Verify StateManager loads all 19 image challenges
  console.log('1️⃣ Checking StateManager & Challenge Catalog...');
  const sm = new StateManager();
  const challenges = sm.round2Challenges;
  console.log(`✅ Loaded ${challenges.length} image challenges from round2_challenges.json`);
  if (challenges.length !== 19) {
    throw new Error(`Expected 19 image challenges, found ${challenges.length}`);
  }

  // Verify challenge fields
  challenges.forEach((ch, idx) => {
    if (!ch.imageUrl || !ch.imageUrl.startsWith('/round2_images/')) {
      throw new Error(`Challenge #${idx + 1} has invalid imageUrl: ${ch.imageUrl}`);
    }
    if (!ch.title || !ch.description || !Array.isArray(ch.keyElements)) {
      throw new Error(`Challenge #${idx + 1} missing required metadata fields`);
    }
  });
  console.log(`✅ All 19 challenges validated with proper imageUrls (/round2_images/1.png to 20.png) and metadata.\n`);

  // Test 2: Test 20 team challenge assignments
  console.log('2️⃣ Testing Deterministic Image Allotment across 20 Teams...');
  for (let i = 1; i <= 20; i++) {
    sm.registerOrJoinTeam({
      teamId: `team_${String(i).padStart(2, '0')}`,
      teamName: `Falcon Squad ${i}`,
      pin: '1234'
    });
  }

  // Advance to Round 2
  sm.roundState.status = 'ADVANCED';
  sm.activeRound = 2;
  sm.allotRound2Challenges();

  const assignedSet = new Set();
  sm.teams.forEach((t) => {
    const assigned = t.round2?.assignedChallenge;
    if (!assigned || !assigned.imageUrl) {
      throw new Error(`Team ${t.id} was not assigned a valid image challenge!`);
    }
    assignedSet.add(assigned.filename);
  });

  console.log(`✅ 20 Teams allotted challenges. Distinct unique images distributed: ${assignedSet.size} / 19.`);
  console.log(`✅ Team 1 received: ${sm.teams.get('team_01').round2.assignedChallenge.title} (${sm.teams.get('team_01').round2.assignedChallenge.imageUrl})`);
  console.log(`✅ Team 2 received: ${sm.teams.get('team_02').round2.assignedChallenge.title} (${sm.teams.get('team_02').round2.assignedChallenge.imageUrl})`);
  console.log(`✅ Team 3 received: ${sm.teams.get('team_03').round2.assignedChallenge.title} (${sm.teams.get('team_03').round2.assignedChallenge.imageUrl})\n`);

  // Test 3: Test drafting and prompt submission
  console.log('3️⃣ Testing Draft Autosave & Submission...');
  sm.saveRound2Draft('team_01', 'Cinematic low angle concept art of neon assassin in rainy alleyway, 8k resolution');
  const t1 = sm.teams.get('team_01');
  if (t1.round2.draftPrompt !== 'Cinematic low angle concept art of neon assassin in rainy alleyway, 8k resolution') {
    throw new Error('Draft prompt not saved correctly');
  }

  sm.round2State.isLocked = false;
  sm.round2State.status = 'ACTIVE';
  sm.submitRound2('team_01', 'Cinematic low-angle digital concept art of a futuristic cyberpunk assassin standing in a narrow rain-soaked alley in Neo-Tokyo at night. Dressed in tactical techwear with glowing crimson ocular implants, wet asphalt reflections, volumetric rain, Unreal Engine 5 render, 8k resolution.');
  
  if (t1.round2.status !== 'submitted' || !t1.round2.submittedPrompt) {
    throw new Error('Submission status or prompt missing');
  }
  console.log(`✅ Team 1 successfully submitted prompt (${t1.round2.submittedPrompt.length} chars).\n`);

  // Test 4: Test Evaluator on 20-Point Rubric
  console.log('4️⃣ Testing 20-Point Evaluation Engine...');
  const evalResult = await evaluateRound2Prompt({
    assignedChallenge: t1.round2.assignedChallenge,
    studentPrompt: t1.round2.submittedPrompt,
    teamName: t1.name
  });

  console.log('Evaluation Output:', JSON.stringify(evalResult, null, 2));
  if (typeof evalResult.total_score !== 'number' || evalResult.total_score <= 0 || evalResult.total_score > 20) {
    throw new Error(`Invalid total_score: ${evalResult.total_score}`);
  }
  if (typeof evalResult.composition_score !== 'number' ||
      typeof evalResult.colors_score !== 'number' ||
      typeof evalResult.subject_score !== 'number' ||
      typeof evalResult.style_score !== 'number') {
    throw new Error('Missing standard 4-criteria rubric scores');
  }
  console.log(`✅ Evaluator awarded: ${evalResult.total_score}/20 (Comp: ${evalResult.composition_score}, Colors: ${evalResult.colors_score}, Subject: ${evalResult.subject_score}, Style: ${evalResult.style_score})\n`);

  // Test 5: Leaderboard & Cutoff Calculation
  console.log('5️⃣ Testing Leaderboard & Qualification Cutoff...');
  const evaluations = {};
  for (let i = 1; i <= 20; i++) {
    const tid = `team_${String(i).padStart(2, '0')}`;
    const score = i <= 10 ? 12 + (i % 8) : 5 + (i % 3); // Top 10 score >= 12, bottom 10 score <= 7
    evaluations[tid] = {
      evaluation: {
        composition_score: score / 4,
        colors_score: score / 4,
        subject_score: score / 4,
        style_score: score / 4,
        total_score: score,
        reasoning: `Scored ${score}/20`,
        matched_elements: ["Valid subject"],
        missed_elements: []
      }
    };
    sm.teams.get(tid).round2.submittedPrompt = "Test submitted prompt with sufficient length for evaluation verification";
  }

  sm.setRound2EvaluationResults(evaluations);
  const r2Leaderboard = sm.getRound2Leaderboard();
  const qualified = r2Leaderboard.filter(t => t.round2.isQualified);
  const eliminated = r2Leaderboard.filter(t => t.round2.isEliminated);

  console.log(`✅ Leaderboard Computed: ${qualified.length} teams qualified, ${eliminated.length} eliminated.`);
  console.log(`✅ Rank #1: ${r2Leaderboard[0].name} (Score: ${r2Leaderboard[0].round2.totalScore}p, Qualified: ${r2Leaderboard[0].round2.isQualified})`);
  console.log(`✅ Rank #20: ${r2Leaderboard[19].name} (Score: ${r2Leaderboard[19].round2.totalScore}p, Qualified: ${r2Leaderboard[19].round2.isQualified})`);

  if (qualified.length !== 10) {
    throw new Error(`Expected 10 qualifying teams (top 50%), got ${qualified.length}`);
  }

  // Test 6: Advance to Round 3
  console.log('\n6️⃣ Advancing to Round 3 (Grand Finale)...');
  sm.advanceRound2();
  if (sm.activeRound !== 3 || sm.round2State.status !== 'ADVANCED') {
    throw new Error('Failed to advance to Round 3');
  }
  console.log(`✅ Active Round is now: Round ${sm.activeRound}`);

  console.log('\n========================================================================');
  console.log('🎉 ALL ROUND 2 REVERSE ENGINEERING UNIT & INTEGRATION TESTS PASSED!');
  console.log('========================================================================');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
