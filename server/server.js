import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { StateManager } from './stateManager.js';
import { evaluateSubmission, evaluateBatchWithConcurrency } from './evaluator.js';
import { evaluateRound2Prompt, evaluateRound2Challenge1, evaluateRound2Challenge2 } from './evaluatorRound2.js';
import { evaluateRound3Submission } from './evaluatorRound3.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 10000,
  pingInterval: 5000
});

const PORT = process.env.PORT || 3001;
const ADMIN_PIN = process.env.ADMIN_PIN || "admin123";

const stateManager = new StateManager();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- REST Endpoints ---

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: Date.now(),
    activeRound: stateManager.activeRound,
    r1Status: stateManager.roundState.status,
    r2Status: stateManager.round2State.status,
    r3Status: stateManager.round3State.status
  });
});

app.get('/api/teams', (req, res) => {
  const teams = Array.from(stateManager.teams.values()).map(t => ({
    id: t.id,
    name: t.name,
    connected: t.connected,
    submissionStatus: t.submissionStatus,
    r1Qualified: t.isQualified,
    r2Qualified: t.round2.isQualified,
    r3Rank: t.round3.finalRank
  }));
  res.json({ teams });
});

app.get('/api/export/csv', (req, res) => {
  const teams = stateManager.getLeaderboard();
  let csv = "Rank,Team ID,Team Name,R1 Status,R1 Score (20),R2 C1 Score (20),R2 C2 Score (20),R2 Total (40),R3 Total (50),Tournament Final Verdict\n";

  teams.forEach(t => {
    const r1Score = t.evaluation?.total_score ?? '-';
    const r2C1 = t.round2?.c1_evaluation?.total_score ?? '-';
    const r2C2 = t.round2?.c2_evaluation?.total_score ?? '-';
    const r2Total = t.round2?.totalScore || '-';
    const r3Total = t.round3?.evaluation?.total_score ?? '-';
    const verdict = t.round3?.finalRank ? `Rank #${t.round3.finalRank}` : (t.round2?.isQualified ? "Round 3 Finalist" : (t.isQualified ? "Round 2 Qualified" : "Round 1 Participant"));

    csv += `"${t.rank || '-'}","${t.id}","${t.name}","${t.submissionStatus}",${r1Score},${r2C1},${r2C2},${r2Total},${r3Total},"${verdict}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=prompt_wars_championship_results.csv');
  res.send(csv);
});

// Broadcast Helpers
function broadcastToAll(event, payload) {
  io.emit(event, payload);
}

function broadcastToAdmins(event, payload) {
  io.to('admin_room').emit(event, payload);
  for (const socketId of stateManager.adminSockets) {
    io.to(socketId).emit(event, payload);
  }
}

function broadcastToProjectors(event, payload) {
  for (const socketId of stateManager.projectorSockets) {
    io.to(socketId).emit(event, payload);
  }
}

function syncTeamClient(teamId) {
  const team = stateManager.teams.get(teamId);
  if (!team) return;
  const payload = stateManager.getTeamView(teamId);
  // Broadcast to ALL sockets for this team (multi-tab support)
  if (team.socketIds?.size > 0) {
    for (const sid of team.socketIds) {
      io.to(sid).emit('team:state_sync', payload);
    }
  } else if (team.socketId) {
    io.to(team.socketId).emit('team:state_sync', payload);
  }
}

function syncAllTeamClients() {
  for (const [teamId, team] of stateManager.teams.entries()) {
    if (!team.connected) continue;
    const payload = stateManager.getTeamView(teamId);
    // Broadcast to ALL sockets for this team (multi-tab support)
    if (team.socketIds?.size > 0) {
      for (const sid of team.socketIds) {
        io.to(sid).emit('team:state_sync', payload);
      }
    } else if (team.socketId) {
      io.to(team.socketId).emit('team:state_sync', payload);
    }
  }
}

function syncAdminClients() {
  const hostView = stateManager.getHostView();
  broadcastToAdmins('admin:state_sync', hostView);
}

function syncProjectorClients() {
  const projView = stateManager.getProjectorView();
  broadcastToProjectors('projector:state_sync', projView);
}

function broadcastTimerState() {
  broadcastToAll('timer:tick', {
    activeRound: stateManager.activeRound,
    round1: {
      timerRemaining: stateManager.roundState.timerRemaining,
      timerRunning: stateManager.roundState.timerRunning,
      status: stateManager.roundState.status,
      isLocked: stateManager.roundState.isLocked
    },
    round2: {
      timerRemaining: stateManager.round2State.timerRemaining,
      timerRunning: stateManager.round2State.timerRunning,
      status: stateManager.round2State.status,
      isLocked: stateManager.round2State.isLocked
    },
    round3: {
      timerRemaining: stateManager.round3State.timerRemaining,
      timerRunning: stateManager.round3State.timerRunning,
      bombTimerRemaining: stateManager.round3State.bombTimerRemaining,
      bombRunning: stateManager.round3State.bombRunning,
      phase: stateManager.round3State.phase,
      status: stateManager.round3State.status,
      isLocked: stateManager.round3State.isLocked
    }
  });
  syncAdminClients();
}

// Global 1-Second Authoritative Server Tick
setInterval(() => {
  const didTick = stateManager.tickTimer();
  broadcastTimerState();
}, 1000);

// --- Socket.IO Real-time Connection Engine ---

io.on('connection', (socket) => {
  // 1. Team Authentication & Dynamic Registration / Reconnect
  socket.on('team:join', ({ teamName, teamNumber, teamId, pin }, callback) => {
    try {
      const team = stateManager.registerOrJoinTeam({
        teamName,
        teamNumber,
        teamId,
        pin,
        socketId: socket.id
      });
      socket.join(`team:${team.id}`);
      
      const teamView = stateManager.getTeamView(team.id);
      callback?.({ success: true, teamView });
      
      syncAdminClients();
      syncProjectorClients();
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  socket.on('admin:remove_team', ({ teamId }) => {
    stateManager.removeTeam(teamId);
    syncAdminClients();
    syncProjectorClients();
  });

  // ==========================================
  // ROUND 1 TEAM EVENTS
  // ==========================================

  socket.on('team:spin', ({ teamId }, callback) => {
    try {
      const team = stateManager.performSpin(teamId);
      socket.emit('team:state_sync', stateManager.getTeamView(teamId));
      syncAdminClients();
      callback?.({ success: true, spinResult: team.spinResult, assignedGenre: team.assignedGenre, question: team.assignedQuestion });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  socket.on('team:draft_update', ({ teamId, draftText }) => {
    stateManager.saveDraft(teamId, draftText);
    broadcastToAdmins('admin:team_draft_update', { teamId, length: (draftText || "").length });
  });

  socket.on('team:submit', ({ teamId, improvedPrompt }, callback) => {
    try {
      const team = stateManager.submitPrompt(teamId, improvedPrompt);
      socket.emit('team:state_sync', stateManager.getTeamView(teamId));
      syncAdminClients();
      syncProjectorClients();
      callback?.({ success: true, submittedAt: team.submittedAt });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // ==========================================
  // ROUND 2 TEAM EVENTS (REVERSE ENGINEERING)
  // ==========================================

  socket.on('team:round2_draft_update', ({ teamId, challengeType, draftText, promptText }) => {
    const text = draftText !== undefined ? draftText : promptText;
    stateManager.saveRound2Draft(teamId, text, challengeType);
    broadcastToAdmins('admin:r2_draft_update', { teamId, challengeType, length: (text || "").length });
  });

  socket.on('team:round2_submit', ({ teamId, challengeType, promptText, studentPrompt }, callback) => {
    try {
      const text = promptText !== undefined ? promptText : studentPrompt;
      const team = stateManager.submitRound2(teamId, text, challengeType);
      syncTeamClient(teamId);
      syncAdminClients();
      syncProjectorClients();
      callback?.({ success: true, status: team.round2.status });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // Backward compatibility alias for submit_c1
  socket.on('team:round2_submit_c1', ({ teamId, studentPrompt, promptText }, callback) => {
    try {
      const text = studentPrompt !== undefined ? studentPrompt : promptText;
      const team = stateManager.submitRound2(teamId, text, 'image');
      syncTeamClient(teamId);
      syncAdminClients();
      syncProjectorClients();
      callback?.({ success: true, status: team.round2.status });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // ==========================================
  // ROUND 3 TEAM EVENTS (MASTER PROMPT & BOMB)
  // ==========================================

  socket.on('team:round3_master_draft', ({ teamId, draftText }) => {
    stateManager.saveRound3MasterDraft(teamId, draftText);
    broadcastToAdmins('admin:r3_draft_update', { teamId, length: (draftText || "").length });
  });

  socket.on('team:round3_bomb_draft', ({ teamId, adaptedText }) => {
    stateManager.saveRound3BombDraft(teamId, adaptedText);
  });

  socket.on('team:round3_submit', ({ teamId, adaptedPrompt }, callback) => {
    try {
      const team = stateManager.submitRound3(teamId, adaptedPrompt);
      socket.emit('team:state_sync', stateManager.getTeamView(teamId));
      syncAdminClients();
      syncProjectorClients();
      callback?.({ success: true, submittedAt: team.round3.submittedAt });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // ==========================================
  // HOST ADMIN EVENTS & CONTROLS
  // ==========================================

  socket.on('admin:join', ({ adminPin }, callback) => {
    if (adminPin !== ADMIN_PIN) {
      return callback?.({ success: false, error: 'Unauthorized: Invalid Admin PIN' });
    }
    stateManager.registerAdmin(socket.id);
    socket.join('admin_room');
    callback?.({ success: true, hostView: stateManager.getHostView() });
  });

  socket.on('admin:set_active_round', ({ round }) => {
    stateManager.activeRound = Number(round) || 1;
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  // Round 1 Admin Controls
  socket.on('admin:unlock_round', () => {
    stateManager.unlockRound();
    broadcastTimerState();
    broadcastToAll('round:unlocked', { round: 1, duration: stateManager.roundState.timerDuration });
    syncAllTeamClients();
  });

  socket.on('admin:lock_round', () => {
    stateManager.lockRound();
    broadcastTimerState();
    broadcastToAll('round:locked', { round: 1 });
    syncAllTeamClients();
  });

  socket.on('admin:start_timer', () => {
    stateManager.startTimer();
    broadcastTimerState();
    broadcastToAll('round:unlocked', { round: 1, duration: stateManager.roundState.timerDuration });
    syncAllTeamClients();
  });

  socket.on('admin:pause_timer', () => {
    stateManager.pauseTimer();
    broadcastTimerState();
    syncAllTeamClients();
  });

  socket.on('admin:reset_timer', ({ durationSeconds }) => {
    stateManager.resetTimer(durationSeconds || 600);
    broadcastTimerState();
    syncAllTeamClients();
  });

  socket.on('admin:add_time', ({ seconds }) => {
    stateManager.addTime(seconds || 60);
    broadcastTimerState();
    syncAllTeamClients();
  });

  socket.on('admin:evaluate_all', async (data, callback) => {
    let teamsToEvaluate = Array.from(stateManager.teams.values()).filter(
      t => (t.submittedPrompt && t.submissionStatus === 'submitted') || t.submissionStatus === 'drafting' || t.draftPrompt || t.spinResult
    );

    if (teamsToEvaluate.length === 0) {
      teamsToEvaluate = Array.from(stateManager.teams.values());
    }

    if (teamsToEvaluate.length === 0) {
      return callback?.({ success: false, error: 'No registered teams found to evaluate.' });
    }

    stateManager.roundState.status = 'EVALUATING';
    broadcastTimerState();

    callback?.({ success: true, total: teamsToEvaluate.length });

    const items = teamsToEvaluate.map(team => ({
      id: team.id,
      name: team.name,
      badPrompt: team.assignedQuestion?.badPrompt || "Make an advertisement for a product.",
      genreName: team.assignedGenre?.name || "CREATIVE",
      improvedPrompt: team.submittedPrompt || team.draftPrompt || ""
    }));

    const evaluations = await evaluateBatchWithConcurrency(
      items,
      async (item) => {
        return await evaluateSubmission({
          badPrompt: item.badPrompt,
          genreName: item.genreName,
          improvedPrompt: item.improvedPrompt,
          teamName: item.name
        });
      },
      2,
      ({ completed, total, currentTeam }) => {
        broadcastToAdmins('admin:eval_progress', { completed, total, currentTeam });
      }
    );

    stateManager.setEvaluationResults(evaluations);
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAdmins('admin:eval_complete', { total: items.length });
  });

  socket.on('admin:set_manual_score', ({ teamId, criteriaKey, score }) => {
    const updatedTeam = stateManager.setManualScore(teamId, criteriaKey, score);
    syncAdminClients();
    if (updatedTeam) syncTeamClient(teamId);
  });

  socket.on('admin:advance_round', () => {
    stateManager.advanceRound();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round:verdict', {
      round: 1,
      advanceTriggered: true,
      leaderboard: stateManager.getLeaderboard().map(t => ({
        rank: t.rank,
        teamId: t.id,
        teamName: t.name,
        score: t.evaluation?.total_score || 0,
        isQualified: t.isQualified,
        isEliminated: t.isEliminated
      }))
    });
  });

  // Round 2 Admin Controls
  socket.on('admin:unlock_round2', () => {
    stateManager.unlockRound2();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round2:unlocked', { round: 2, duration: stateManager.round2State.timerDuration });
  });

  socket.on('admin:lock_round2', () => {
    stateManager.lockRound2();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:start_round2_timer', () => {
    stateManager.startRound2Timer();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:pause_round2_timer', () => {
    stateManager.pauseRound2Timer();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:reset_round2_timer', ({ durationSeconds }) => {
    stateManager.resetRound2Timer(durationSeconds || 900);
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:evaluate_round2', async (data, callback) => {
    const qualifiedTeams = Array.from(stateManager.teams.values()).filter(t => t.isQualified);
    const targetTeams = qualifiedTeams.length > 0 ? qualifiedTeams : Array.from(stateManager.teams.values());
    if (targetTeams.length === 0) {
      return callback?.({ success: false, error: 'No teams to evaluate for Round 2.' });
    }

    stateManager.round2State.status = 'EVALUATING';
    broadcastTimerState();
    syncAdminClients();
    syncProjectorClients();
    callback?.({ success: true, total: targetTeams.length });

    const items = targetTeams.map(team => ({
      id: team.id,
      name: team.name,
      assignedChallenge: team.round2?.assignedChallenge || stateManager.round2Challenges[0],
      studentPrompt: team.round2?.submittedPrompt || team.round2?.draftPrompt || team.round2?.c1_submittedPrompt || team.round2?.c1_draft || ""
    }));

    const evaluations = await evaluateBatchWithConcurrency(
      items,
      async (item) => {
        const evalResult = await evaluateRound2Prompt({
          assignedChallenge: item.assignedChallenge,
          studentPrompt: item.studentPrompt,
          teamName: item.name
        });
        return { evaluation: evalResult, totalScore: evalResult.total_score };
      },
      2,
      ({ completed, total, currentTeam }) => {
        broadcastToAdmins('admin:r2_eval_progress', { completed, total, currentTeam });
      }
    );

    stateManager.setRound2EvaluationResults(evaluations);
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAdmins('admin:r2_eval_complete', { total: targetTeams.length });
  });

  socket.on('admin:set_round2_score', ({ teamId, criteriaKey, score }) => {
    stateManager.setRound2ManualScore(teamId, criteriaKey, score);
    syncTeamClient(teamId);
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:advance_round2', () => {
    stateManager.advanceRound2();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round2:verdict', {
      round: 2,
      advanceTriggered: true,
      leaderboard: stateManager.getRound2Leaderboard().map(t => ({
        rank: t.round2.rank,
        teamId: t.id,
        teamName: t.name,
        totalScore: t.round2.totalScore,
        isQualified: t.round2.isQualified,
        isEliminated: t.round2.isEliminated
      }))
    });
  });

  // Round 3 Admin Controls
  socket.on('admin:unlock_round3', () => {
    stateManager.unlockRound3();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round3:unlocked', { round: 3, duration: stateManager.round3State.timerDuration });
  });

  socket.on('admin:lock_round3', () => {
    stateManager.lockRound3();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:start_round3_timer', () => {
    stateManager.startRound3Timer();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:pause_round3_timer', () => {
    stateManager.pauseRound3Timer();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:reset_round3_timer', ({ durationSeconds }) => {
    stateManager.resetRound3Timer(durationSeconds || 900);
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  const handleSabotageRelease = () => {
    stateManager.detonateFinalBomb();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round3:bomb_detonated', {
      durationSeconds: 30,
      detonatedAt: Date.now()
    });
  };

  socket.on('admin:detonate_bomb', handleSabotageRelease);
  socket.on('admin:release_sabotage', handleSabotageRelease);

  socket.on('admin:evaluate_round3', async (data, callback) => {
    const qualifiedTeams = Array.from(stateManager.teams.values()).filter(t => (t.round2?.isQualified && !t.round2?.isEliminated) || (t.isQualified && !t.isEliminated));
    const teamsInR3 = qualifiedTeams.length > 0 ? qualifiedTeams : Array.from(stateManager.teams.values());

    if (teamsInR3.length === 0) {
      return callback?.({ success: false, error: 'No teams registered for Round 3.' });
    }

    stateManager.round3State.status = 'EVALUATING';
    broadcastTimerState();
    syncAdminClients();
    syncProjectorClients();
    callback?.({ success: true, total: teamsInR3.length });

    const evaluations = {};
    let completed = 0;

    for (const team of teamsInR3) {
      const caseItem = team.round3.assignedCase || stateManager.round3Data.cases[0] || {
        title: "National Tech Fest Growth Crisis",
        category: "Growth & Event Operations",
        scenario: { context: "Flagship 3-day tech symposium in 30 days.", metrics: {}, requiredPillars: [] }
      };
      const bombItem = team.round3.assignedBomb || caseItem.bombs?.[0] || {
        headline: "🚨 CRITICAL CRISIS INJECTION",
        description: "Emergency adaptation required.",
        directive: "Pivot strategy immediately."
      };
      const mPrompt = team.round3.masterPrompt || team.round3.masterDraft || "";
      const aPrompt = team.round3.adaptedPrompt || team.round3.adaptedDraft || mPrompt;

      const evalRes = await evaluateRound3Submission({
        caseData: caseItem,
        bombData: bombItem,
        masterPrompt: mPrompt,
        adaptedPrompt: aPrompt,
        teamName: team.name
      });

      evaluations[team.id] = evalRes;
      completed++;
      broadcastToAdmins('admin:r3_eval_progress', { completed, total: teamsInR3.length, currentTeam: team.name });
    }

    stateManager.setRound3EvaluationResults(evaluations);
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAdmins('admin:r3_eval_complete', { total: teamsInR3.length });
  });

  socket.on('admin:reveal_podium', () => {
    const winners = stateManager.revealPodium();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round3:podium_revealed', winners);
  });

  socket.on('admin:reset_event', () => {
    stateManager.resetAll();
    broadcastTimerState();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('tournament:reset', { activeRound: 1 });
  });

  socket.on('admin:clear_all_teams', () => {
    stateManager.teams.clear();
    stateManager.saveSnapshot();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('tournament:reset', { activeRound: 1 });
  });

  // Projector Connect
  socket.on('projector:join', (data, callback) => {
    stateManager.registerProjector(socket.id);
    socket.join('projector_room');
    callback?.({ success: true, projectorView: stateManager.getProjectorView() });
  });

  // Disconnect Handling
  socket.on('disconnect', () => {
    const disconnectedTeam = stateManager.unregisterSocket(socket.id);
    if (disconnectedTeam) {
      syncAdminClients();
    }
  });
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process. Please close existing instances or run via 'npm run dev:all'.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ PROMPT WARS 3-Round Tournament Server running on http://localhost:${PORT}`);
});
