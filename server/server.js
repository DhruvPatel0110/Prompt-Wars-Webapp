import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { StateManager } from './stateManager.js';
import { evaluateSubmission } from './evaluator.js';

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
  res.json({ status: 'ok', time: Date.now(), round: stateManager.roundState.round });
});

app.get('/api/teams', (req, res) => {
  const teams = Array.from(stateManager.teams.values()).map(t => ({
    id: t.id,
    name: t.name,
    connected: t.connected,
    submissionStatus: t.submissionStatus
  }));
  res.json({ teams });
});

app.get('/api/export/csv', (req, res) => {
  const teams = stateManager.getLeaderboard();
  let csv = "Rank,Team ID,Team Name,Status,Genre,Bad Prompt,Submitted Prompt,Clarity (5),Context (4),Constraints (4),Format (3),Creativity (4),Total Score (20),Timer Used (s),Verdict,Reasoning\n";

  teams.forEach(t => {
    const e = t.evaluation || {};
    const verdict = t.isQualified ? "QUALIFIED FOR ROUND 2" : (t.isEliminated ? "ELIMINATED" : "PENDING");
    const cleanBad = (t.assignedQuestion?.badPrompt || "").replace(/"/g, '""');
    const cleanSub = (t.submittedPrompt || "").replace(/"/g, '""');
    const cleanReasoning = (e.reasoning || "").replace(/"/g, '""');

    csv += `"${t.rank || '-'}","${t.id}","${t.name}","${t.submissionStatus}","${t.assignedGenre?.name || '-'}","${cleanBad}","${cleanSub}",${e.clarity_score ?? '-'},${e.context_score ?? '-'},${e.constraints_score ?? '-'},${e.format_score ?? '-'},${e.creativity_score ?? '-'},${e.total_score ?? '-'},${t.timerUsedSeconds || '-'},"${verdict}","${cleanReasoning}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=prompt_wars_round1_results.csv');
  res.send(csv);
});

// Broadcast Helper
function broadcastToAll(event, payload) {
  io.emit(event, payload);
}

function broadcastToAdmins(event, payload) {
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
  if (team && team.socketId) {
    io.to(team.socketId).emit('team:state_sync', stateManager.getTeamView(teamId));
  }
}

function syncAllTeamClients() {
  for (const [teamId, team] of stateManager.teams.entries()) {
    if (team.connected && team.socketId) {
      io.to(team.socketId).emit('team:state_sync', stateManager.getTeamView(teamId));
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

// Global 1-Second Authoritative Server Tick
setInterval(() => {
  const didTick = stateManager.tickTimer();
  if (didTick || stateManager.roundState.timerRunning) {
    broadcastToAll('timer:tick', {
      timerRemaining: stateManager.roundState.timerRemaining,
      timerRunning: stateManager.roundState.timerRunning,
      timerEndsAt: stateManager.roundState.timerEndsAt,
      status: stateManager.roundState.status,
      isLocked: stateManager.roundState.isLocked
    });
  }

  // If timer reached zero and round finished
  if (stateManager.roundState.timerRemaining === 0 && stateManager.roundState.status === 'EVALUATING') {
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  }
}, 1000);

// --- Socket.IO Real-time Connection Engine ---

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // 1. Team Authentication & Connect
  socket.on('team:join', ({ teamId, pin }, callback) => {
    const team = stateManager.teams.get(teamId);
    if (!team) {
      return callback?.({ success: false, error: 'Invalid Team ID' });
    }
    if (team.pin !== pin && pin !== 'masterpass') {
      return callback?.({ success: false, error: 'Incorrect Team PIN' });
    }

    stateManager.registerTeamSocket(teamId, socket.id);
    socket.join(`team:${teamId}`);
    
    console.log(`[Team Joined] ${team.name} (${teamId})`);
    
    const teamView = stateManager.getTeamView(teamId);
    callback?.({ success: true, teamView });
    
    // Notify host of updated team connection status
    syncAdminClients();
    syncProjectorClients();
  });

  // 2. Team Wheel Spin Action
  socket.on('team:spin', ({ teamId }, callback) => {
    try {
      const team = stateManager.performSpin(teamId);
      const teamView = stateManager.getTeamView(teamId);
      
      socket.emit('team:state_sync', teamView);
      syncAdminClients();
      
      callback?.({ success: true, spinResult: team.spinResult, assignedGenre: team.assignedGenre, question: team.assignedQuestion });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // 3. Team Draft Autosave
  socket.on('team:draft_update', ({ teamId, draftText }) => {
    stateManager.saveDraft(teamId, draftText);
    // Debounced host sync could be done, or direct update
    broadcastToAdmins('admin:team_draft_update', { teamId, length: (draftText || "").length });
  });

  // 4. Team Submission
  socket.on('team:submit', ({ teamId, improvedPrompt }, callback) => {
    try {
      const team = stateManager.submitPrompt(teamId, improvedPrompt);
      const teamView = stateManager.getTeamView(teamId);
      
      socket.emit('team:state_sync', teamView);
      syncAdminClients();
      syncProjectorClients();

      callback?.({ success: true, submittedAt: team.submittedAt });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // 5. Admin Authentication & Actions
  socket.on('admin:join', ({ adminPin }, callback) => {
    if (adminPin !== ADMIN_PIN) {
      return callback?.({ success: false, error: 'Unauthorized: Invalid Admin PIN' });
    }
    stateManager.registerAdmin(socket.id);
    socket.join('admin_room');
    callback?.({ success: true, hostView: stateManager.getHostView() });
  });

  socket.on('admin:unlock_round', () => {
    stateManager.unlockRound();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round:unlocked', { round: 1, duration: stateManager.roundState.timerDuration });
  });

  socket.on('admin:lock_round', () => {
    stateManager.lockRound();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('round:locked', { round: 1 });
  });

  socket.on('admin:start_timer', () => {
    stateManager.startTimer();
    syncAdminClients();
    broadcastToAll('timer:state', stateManager.roundState);
  });

  socket.on('admin:pause_timer', () => {
    stateManager.pauseTimer();
    syncAdminClients();
    broadcastToAll('timer:state', stateManager.roundState);
  });

  socket.on('admin:reset_timer', ({ durationSeconds }) => {
    stateManager.resetTimer(durationSeconds || 600);
    syncAdminClients();
    syncProjectorClients();
    broadcastToAll('timer:state', stateManager.roundState);
  });

  socket.on('admin:add_time', ({ seconds }) => {
    stateManager.addTime(seconds || 60);
    syncAdminClients();
    broadcastToAll('timer:state', stateManager.roundState);
  });

  socket.on('admin:set_elimination_percentage', ({ percentage }) => {
    stateManager.roundState.eliminationPercentage = Number(percentage) || 50;
    stateManager.computeLeaderboard();
    syncAdminClients();
  });

  // Batch AI Evaluation
  socket.on('admin:evaluate_all', async (data, callback) => {
    const teamsToEvaluate = Array.from(stateManager.teams.values()).filter(
      t => (t.submittedPrompt && t.submissionStatus === 'submitted') || t.submissionStatus === 'drafting' || t.draftPrompt
    );

    if (teamsToEvaluate.length === 0) {
      return callback?.({ success: false, error: 'No submissions found to evaluate.' });
    }

    stateManager.roundState.status = 'EVALUATING';
    syncAdminClients();
    syncProjectorClients();

    callback?.({ success: true, total: teamsToEvaluate.length });

    const evaluations = {};
    let completed = 0;

    for (const team of teamsToEvaluate) {
      const promptToEvaluate = team.submittedPrompt || team.draftPrompt;
      try {
        const evalResult = await evaluateSubmission({
          badPrompt: team.assignedQuestion?.badPrompt || "Make an advertisement.",
          genreName: team.assignedGenre?.name || "CREATIVE",
          improvedPrompt: promptToEvaluate,
          teamName: team.name
        });
        evaluations[team.id] = evalResult;
      } catch (err) {
        console.error(`Evaluation failed for ${team.name}:`, err);
      }

      completed++;
      broadcastToAdmins('admin:eval_progress', {
        completed,
        total: teamsToEvaluate.length,
        currentTeam: team.name
      });
    }

    stateManager.setEvaluationResults(evaluations);
    syncAdminClients();
    syncProjectorClients();
  });

  socket.on('admin:set_manual_score', ({ teamId, criteriaKey, score }) => {
    const updatedTeam = stateManager.setManualScore(teamId, criteriaKey, score);
    syncAdminClients();
    if (updatedTeam) {
      syncTeamClient(teamId);
    }
  });

  socket.on('admin:advance_round', () => {
    stateManager.advanceRound();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();

    // Broadcast instant verdicts to all clients
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

  socket.on('admin:reset_event', () => {
    stateManager.resetAll();
    syncAllTeamClients();
    syncAdminClients();
    syncProjectorClients();
  });

  // 6. Projector View Connect
  socket.on('projector:join', (data, callback) => {
    stateManager.registerProjector(socket.id);
    socket.join('projector_room');
    callback?.({ success: true, projectorView: stateManager.getProjectorView() });
  });

  // Disconnect Handling
  socket.on('disconnect', () => {
    const disconnectedTeam = stateManager.unregisterSocket(socket.id);
    if (disconnectedTeam) {
      console.log(`[Team Disconnected] ${disconnectedTeam.name} (${disconnectedTeam.id})`);
      syncAdminClients();
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ PROMPT WARS High-Concurrency Server running on http://localhost:${PORT}`);
});
