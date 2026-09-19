import { StateManager } from './stateManager.js';
const stateManager = new StateManager();

console.log("==============================================");
console.log("🧪 TESTING 50% STRENGTH ADVANCEMENT CUTOFF");
console.log("==============================================");

// 1. Reset state
stateManager.resetAll();

// 2. Register 10 teams
console.log("1. Registering 10 teams...");
const teams = [];
for (let i = 1; i <= 10; i++) {
  const team = stateManager.registerOrJoinTeam({
    teamName: `Team ${i}`,
    teamId: `team-${i}`
  });
  teams.push(team);
}
console.log(`✅ Registered ${teams.length} teams.`);

// 3. Unlock Round 1 and submit prompts for all 10 teams
stateManager.unlockRound();
teams.forEach((t, i) => {
  stateManager.submitPrompt(t.id, `Reconstructed prompt for team ${i + 1} with high precision and details.`);
});

// 4. Set scores (even with scores below 8.0, e.g. 7.5 down to 1.0)
const evaluations = {};
teams.forEach((t, i) => {
  const score = (10 - i) * 0.75; // Scores from 7.5 down to 0.75
  evaluations[t.id] = {
    total_score: score,
    clarity_score: score / 4,
    techniques_score: score / 4,
    format_score: score / 4,
    creativity_score: score / 4,
    reasoning: `Score: ${score}`
  };
});
stateManager.setEvaluationResults(evaluations);

// 5. Host advances Round 1 to Round 2
console.log("\n2. Host advancing Round 1 to Round 2...");
stateManager.advanceRound();

// 6. Check results
const allViews = teams.map(t => stateManager.getTeamView(t.id));
const qualifiedTeams = allViews.filter(v => v.team.isQualified === true);
const eliminatedTeams = allViews.filter(v => v.team.isEliminated === true);

console.log(`Total Teams: ${allViews.length}`);
console.log(`Qualified Teams (Top 50%): ${qualifiedTeams.length} (Expected: 5)`);
console.log(`Eliminated Teams (Bottom 50%): ${eliminatedTeams.length} (Expected: 5)`);

qualifiedTeams.forEach((v, idx) => {
  console.log(`  - [QUALIFIED #${idx + 1}] ${v.team.name}: Score ${v.team.evaluation?.total_score}p, Rank #${v.team.rank}`);
});

eliminatedTeams.forEach((v, idx) => {
  console.log(`  - [CONCLUDED #${idx + 1}] ${v.team.name}: Score ${v.team.evaluation?.total_score}p, Rank #${v.team.rank}`);
});

if (qualifiedTeams.length !== 5 || eliminatedTeams.length !== 5) {
  console.error("❌ FAILED: 50% cutoff did not qualify exactly 5 out of 10 teams!");
  process.exit(1);
}

// 7. Verify Round 2 Leaderboard has exactly 5 qualified teams
const r2Leaderboard = stateManager.getRound2Leaderboard();
console.log(`\n3. Round 2 Leaderboard Count: ${r2Leaderboard.length} (Expected: 5)`);
if (r2Leaderboard.length !== 5) {
  console.error("❌ FAILED: Round 2 leaderboard does not match 5 qualified teams!");
  process.exit(1);
}

// 8. Verify eliminated teams cannot submit in Round 2
console.log("\n4. Verifying eliminated team (Team 10) is blocked from Round 2...");
try {
  stateManager.submitRound2("team-10", "Attempting Round 2 prompt as eliminated team", "image");
  console.error("❌ FAILED: Team 10 was able to submit in Round 2!");
  process.exit(1);
} catch (err) {
  console.log(`✅ SUCCESS: Team 10 blocked with error: "${err.message}"`);
}

// 9. Verify qualified team (Team 1) can submit in Round 2
console.log("\n5. Verifying qualified team (Team 1) can submit in Round 2...");
try {
  const r2Sub = stateManager.submitRound2("team-1", "A high detailed 3D octane render of cyberpunk city asset.", "image");
  console.log(`✅ SUCCESS: Team 1 submitted Round 2 prompt. Status: ${r2Sub.round2.status}`);
} catch (err) {
  console.error(`❌ FAILED: Team 1 failed to submit in Round 2: ${err.message}`);
  process.exit(1);
}

console.log("\n==============================================");
console.log("🎉 50% PARTICIPANT CUTOFF TEST PASSED PERFECTLY!");
console.log("==============================================");
process.exit(0);
