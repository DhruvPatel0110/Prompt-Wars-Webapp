/**
 * High-Concurrency Stress Test for PROMPT WARS Server
 * Simulates 70 client devices connecting simultaneously, spinning the wheel,
 * sending autosaves, and submitting prompts under rapid burst conditions.
 * Also verifies that the Host Admin receives real-time state_sync and eval_progress events.
 */

import { io } from 'socket.io-client';
import { spawn } from 'child_process';
import net from 'net';

const SERVER_URL = 'http://localhost:3001';
const NUM_CLIENTS = 70;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function runConcurrencyTest() {
  let serverProcess = null;
  const running = await isPortOpen(3001);
  if (!running) {
    console.log('⚡ Launching tournament backend for test suite...');
    serverProcess = spawn('node', ['server/server.js'], { stdio: 'ignore' });
    await sleep(1500);
  }

  console.log(`\n======================================================`);
  console.log(`🚀 STARTING HIGH CONCURRENCY STRESS TEST: ${NUM_CLIENTS} CLIENTS`);
  console.log(`======================================================\n`);

  const clients = [];
  const startConnectTime = Date.now();

  // 1. Connect Host Admin & Setup Listeners
  const adminSocket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
  let adminStateSyncCount = 0;
  let adminEvalProgressEvents = [];
  let adminVerdictReceived = false;
  let adminLastHostView = null;

  await new Promise((resolve) => {
    adminSocket.on('connect', () => {
      adminSocket.emit('admin:join', { adminPin: 'admin123' }, (res) => {
        console.log(`👑 [Host Admin] Connected successfully:`, res.success);
        adminLastHostView = res.hostView;
        resolve(res);
      });
    });
  });

  // Track all admin sync events
  adminSocket.on('admin:state_sync', (data) => {
    adminStateSyncCount++;
    adminLastHostView = data;
  });

  adminSocket.on('admin:eval_progress', (prog) => {
    adminEvalProgressEvents.push(prog);
  });

  adminSocket.on('round:verdict', (data) => {
    adminVerdictReceived = true;
  });

  // Reset event & unlock round
  adminSocket.emit('admin:reset_event');
  await sleep(300);
  adminSocket.emit('admin:unlock_round');
  console.log(`🔓 [Host Admin] Reset Event & Unlocked Round 1`);
  await sleep(300);

  // 2. Connect 70 Student Clients in parallel
  console.log(`\n📡 Connecting ${NUM_CLIENTS} virtual team clients in parallel...`);

  const connectPromises = [];

  for (let i = 1; i <= NUM_CLIENTS; i++) {
    const teamId = `team_${String(i).padStart(2, '0')}`;
    const pin = String(1000 + i);

    const promise = new Promise((resolve, reject) => {
      const socket = io(SERVER_URL, {
        reconnection: true,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        socket.emit('team:join', { teamId, pin }, (res) => {
          if (res?.success) {
            clients.push({ teamId, socket, teamView: res.teamView });
            resolve({ teamId, socket });
          } else {
            reject(new Error(`Failed to join ${teamId}: ${res?.error}`));
          }
        });
      });

      socket.on('connect_error', (err) => {
        reject(err);
      });
    });

    connectPromises.push(promise);
  }

  await Promise.all(connectPromises);
  const connectDuration = Date.now() - startConnectTime;
  console.log(`✅ All ${clients.length}/${NUM_CLIENTS} teams connected and authenticated in ${connectDuration}ms! (Avg: ${(connectDuration / NUM_CLIENTS).toFixed(1)}ms per client)`);

  // Check admin received connection state syncs
  await sleep(500);
  console.log(`📊 [Host Admin] Received ${adminStateSyncCount} state_sync events during connection phase`);
  console.log(`📊 [Host Admin] Sees ${adminLastHostView?.stats?.connectedCount || 0} teams connected`);

  if (adminLastHostView?.stats?.connectedCount < NUM_CLIENTS) {
    console.warn(`⚠️ Admin sees fewer connected teams than expected!`);
  }

  // 3. Simulate Parallel Wheel Spins
  console.log(`\n🎡 Triggering parallel Wheel Spins for all ${NUM_CLIENTS} teams...`);
  const spinStart = Date.now();
  const spinPromises = clients.map(c => {
    return new Promise((resolve) => {
      c.socket.emit('team:spin', { teamId: c.teamId }, (res) => {
        resolve({ teamId: c.teamId, spinResult: res.spinResult, genre: res.assignedGenre?.name });
      });
    });
  });

  const spinResults = await Promise.all(spinPromises);
  const spinDuration = Date.now() - spinStart;
  console.log(`✅ ${spinResults.length}/${NUM_CLIENTS} teams spun their wheels successfully in ${spinDuration}ms!`);

  const genreCounts = spinResults.reduce((acc, r) => {
    acc[r.spinResult] = (acc[r.spinResult] || 0) + 1;
    return acc;
  }, {});
  console.log(`📊 Genre Distribution:`, genreCounts);

  // 4. Simulate Live Draft Autosaves (burst)
  console.log(`\n✍️ Simulating simultaneous autosaves from all ${NUM_CLIENTS} teams...`);
  for (const c of clients) {
    c.socket.emit('team:draft_update', {
      teamId: c.teamId,
      draftText: `Act as a senior expert for this domain. We need a comprehensive 5-point actionable strategy with KPIs and measurable benchmarks. Include audience segmentation, channel mix, and timeline breakdowns. [Team ${c.teamId}]`
    });
  }
  await sleep(600);

  // 5. Simulate Final Prompt Submissions (burst)
  console.log(`\n⚡ Simulating rapid burst submissions for all ${NUM_CLIENTS} teams...`);
  const submitStart = Date.now();
  const samplePrompts = [
    "Act as an award-winning creative director with 15 years in brand storytelling. Create a 30-second high-energy video script for an inter-college AI festival targeting undergraduate computer science students aged 18-22. Tone: vibrant, tech-forward, humorous. Include: memorable tagline, 3 major competition pillars, registration link CTA. Output as structured Markdown with visual cues and audio voiceover columns.",
    "Act as a Principal Financial Analyst at a Fortune 500 firm. Generate a comprehensive Q4 budget allocation and ROI analysis for a university marketing campaign. Must include: CAC, conversion funnel stages, MoM growth targets, contingency reserve. Format: executive summary with tabular breakdown in markdown.",
    "Act as Chief Operations Strategist for high-profile collegiate events. Design a master contingency and logistics plan for a 24-hour national hackathon with 500 attendees on ₹20,000 budget. Include: power failover protocols, volunteer duty matrix, food distribution loops, emergency escalation paths, and T-minus milestone checklist.",
    "Act as a Viral Growth Architect specializing in campus micro-markets. Craft a multi-channel student ambassador launch campaign for a peer-to-peer electric scooter rental. Structure with 3 acquisition phases: guerrilla teaser (week 1), campus influencer blitz (week 2), and referral token rewards (week 3-4). Specify exact KPIs per phase."
  ];

  const submitPromises = clients.map((c, idx) => {
    const promptText = samplePrompts[idx % samplePrompts.length] + ` (Authored by ${c.teamId} with high fidelity parameters and domain expertise.)`;
    return new Promise((resolve) => {
      c.socket.emit('team:submit', { teamId: c.teamId, improvedPrompt: promptText }, (res) => {
        resolve({ teamId: c.teamId, success: res.success, error: res.error });
      });
    });
  });

  const submitResults = await Promise.all(submitPromises);
  const submitDuration = Date.now() - submitStart;
  const successfulSubmissions = submitResults.filter(r => r.success).length;
  const failedSubmissions = submitResults.filter(r => !r.success);
  console.log(`✅ ${successfulSubmissions}/${NUM_CLIENTS} teams submitted prompts in ${submitDuration}ms!`);
  if (failedSubmissions.length > 0) {
    console.error(`❌ ${failedSubmissions.length} submissions failed:`, failedSubmissions.slice(0, 3).map(f => f.error));
  }

  // Check admin sees submissions
  await sleep(500);
  console.log(`📊 [Host Admin] Now sees ${adminLastHostView?.stats?.submittedCount || 'unknown'} submissions in host view`);

  // 6. Test Batch AI Evaluation with real-time admin progress tracking
  console.log(`\n🧠 Triggering Batch AI Evaluation for all ${NUM_CLIENTS} submissions...`);
  const evalStart = Date.now();
  const evalProgressBeforeCount = adminEvalProgressEvents.length;

  await new Promise((resolve) => {
    adminSocket.emit('admin:evaluate_all', {}, (res) => {
      console.log(`[Host Admin] AI Batch Evaluation started for ${res.total} teams.`);
      resolve(res);
    });
  });

  // Wait for evaluation to complete (heuristic engine is fast)
  await sleep(1500);
  const evalDuration = Date.now() - evalStart;
  const newEvalEvents = adminEvalProgressEvents.length - evalProgressBeforeCount;
  console.log(`✅ Batch AI Evaluation completed in ${evalDuration}ms!`);
  console.log(`📊 [Host Admin] Received ${newEvalEvents} real-time eval_progress events during evaluation`);

  if (newEvalEvents < NUM_CLIENTS) {
    console.warn(`⚠️ Expected ${NUM_CLIENTS} eval progress events, got ${newEvalEvents}`);
  } else {
    console.log(`✅ [Host Admin] All ${newEvalEvents}/${NUM_CLIENTS} evaluation progress updates received in real-time!`);
  }

  // Verify the last eval progress event shows completion
  const lastEvalEvent = adminEvalProgressEvents[adminEvalProgressEvents.length - 1];
  if (lastEvalEvent) {
    console.log(`📊 [Host Admin] Final eval event: ${lastEvalEvent.completed}/${lastEvalEvent.total} (${lastEvalEvent.currentTeam})`);
  }

  // 7. Test Advance Round / Verdict Broadcast
  console.log(`\n🏆 Broadcasting Round 2 Qualification & Elimination Verdicts to all ${NUM_CLIENTS} devices...`);

  let verdictCount = 0;
  const verdictPromises = clients.map(c => {
    return new Promise((resolve) => {
      c.socket.on('round:verdict', () => {
        verdictCount++;
        resolve();
      });
    });
  });

  adminSocket.emit('admin:advance_round');
  await Promise.all(verdictPromises);
  console.log(`🎉 All ${verdictCount}/${NUM_CLIENTS} student devices received synchronized verdicts!`);

  // Verify admin also received verdict
  await sleep(300);
  console.log(`📊 [Host Admin] Verdict received by admin: ${adminVerdictReceived}`);
  console.log(`📊 [Host Admin] Total state_sync events during entire test: ${adminStateSyncCount}`);

  // Summary
  console.log(`\n======================================================`);
  console.log(`📋 STRESS TEST RESULTS SUMMARY`);
  console.log(`======================================================`);
  console.log(`   Total Clients:                  ${NUM_CLIENTS}`);
  console.log(`   Connection Time:                ${connectDuration}ms (${(connectDuration / NUM_CLIENTS).toFixed(1)}ms avg)`);
  console.log(`   Parallel Spins:                 ${spinResults.length}/${NUM_CLIENTS} ✅`);
  console.log(`   Burst Submissions:              ${successfulSubmissions}/${NUM_CLIENTS} ✅`);
  console.log(`   Evaluation Time:                ${evalDuration}ms`);
  console.log(`   Admin Eval Progress Events:     ${newEvalEvents}/${NUM_CLIENTS} ✅`);
  console.log(`   Verdict Broadcasts Received:    ${verdictCount}/${NUM_CLIENTS} ✅`);
  console.log(`   Admin State Syncs:              ${adminStateSyncCount} events`);
  console.log(`   Admin Verdict:                  ${adminVerdictReceived ? '✅' : '❌'}`);
  console.log(`   Failed Submissions:             ${failedSubmissions.length}`);

  const allPassed = successfulSubmissions === NUM_CLIENTS
    && verdictCount === NUM_CLIENTS
    && newEvalEvents >= NUM_CLIENTS
    && adminVerdictReceived;

  if (allPassed) {
    console.log(`\n🎯 ALL ${NUM_CLIENTS}-CLIENT STRESS TESTS PASSED WITH ZERO ERRORS!`);
  } else {
    console.log(`\n⚠️ SOME TESTS DID NOT PASS — Review summary above.`);
  }
  console.log(`======================================================\n`);

  // Cleanup
  clients.forEach(c => c.socket.disconnect());
  adminSocket.disconnect();
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(allPassed ? 0 : 1);
}

runConcurrencyTest().catch(err => {
  console.error('Fatal error in stress test:', err);
  process.exit(1);
});
