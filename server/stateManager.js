import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'round1_questions.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams_roster.json');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'game_state_snapshot.json');

export class StateManager {
  constructor() {
    this.questionsData = this.loadJSON(QUESTIONS_FILE, { genres: {}, questions: [] });
    this.teamsRoster = this.loadJSON(TEAMS_FILE, []);
    
    this.roundState = {
      round: 1,
      roundName: "PROMPT MAKEOVER",
      tagline: "SPIN. UNLOCK. REWRITE.",
      isLocked: true,
      status: 'LOCKED', // 'LOCKED' | 'ACTIVE' | 'EVALUATING' | 'EVALUATED' | 'ADVANCED'
      timerDuration: 600,
      timerRemaining: 600,
      timerRunning: false,
      timerStartedAt: null,
      timerEndsAt: null,
      eliminationPercentage: 50,
      advanceTriggered: false
    };

    this.teams = new Map();
    this.adminSockets = new Set();
    this.projectorSockets = new Set();

    this.initTeams();
    this.loadSnapshot();
  }

  loadJSON(filepath, fallback) {
    try {
      if (fs.existsSync(filepath)) {
        const raw = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error(`[StateManager] Failed to read ${filepath}:`, err.message);
    }
    return fallback;
  }

  saveSnapshot() {
    try {
      const data = {
        roundState: this.roundState,
        teams: Array.from(this.teams.values())
      };
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error(`[StateManager] Failed to save snapshot:`, err.message);
    }
  }

  loadSnapshot() {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
        if (data.roundState) {
          // Merge round state but reset active running timers on server startup for safety
          this.roundState = {
            ...this.roundState,
            ...data.roundState,
            timerRunning: false
          };
        }
        if (Array.isArray(data.teams)) {
          data.teams.forEach(t => {
            if (this.teams.has(t.id)) {
              const current = this.teams.get(t.id);
              this.teams.set(t.id, {
                ...current,
                ...t,
                connected: false,
                socketId: null
              });
            }
          });
        }
        console.log(`[StateManager] Hydrated game state from snapshot successfully.`);
      } catch (err) {
        console.error(`[StateManager] Failed to parse snapshot:`, err.message);
      }
    }
  }

  initTeams() {
    this.teamsRoster.forEach(t => {
      this.teams.set(t.id, {
        id: t.id,
        name: t.name,
        pin: t.pin,
        connected: false,
        socketId: null,
        lastSeen: Date.now(),
        spinResult: null,
        assignedGenre: null,
        assignedQuestion: null,
        draftPrompt: "",
        submittedPrompt: null,
        submittedAt: null,
        timerUsedSeconds: null,
        editCount: 0,
        submissionStatus: 'idle', // 'idle' | 'spinning' | 'drafting' | 'submitted' | 'evaluated'
        evaluation: null,
        isEliminated: false,
        isQualified: false,
        rank: null
      });
    });
  }

  // --- Socket Connections ---

  registerTeamSocket(teamId, socketId) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    team.connected = true;
    team.socketId = socketId;
    team.lastSeen = Date.now();
    return team;
  }

  unregisterSocket(socketId) {
    this.adminSockets.delete(socketId);
    this.projectorSockets.delete(socketId);

    for (const team of this.teams.values()) {
      if (team.socketId === socketId) {
        team.connected = false;
        team.socketId = null;
        team.lastSeen = Date.now();
        return team;
      }
    }
    return null;
  }

  registerAdmin(socketId) {
    this.adminSockets.add(socketId);
  }

  registerProjector(socketId) {
    this.projectorSockets.add(socketId);
  }

  // --- Team Actions ---

  performSpin(teamId, requestedGenre = null) {
    const team = this.teams.get(teamId);
    if (!team) throw new Error("Team not found");
    if (this.roundState.isLocked) throw new Error("Round is locked by host");
    if (team.spinResult) return team; // Already spun

    const genresKeys = ['A', 'B', 'C', 'D'];
    const genreKey = requestedGenre && genresKeys.includes(requestedGenre)
      ? requestedGenre
      : genresKeys[Math.floor(Math.random() * genresKeys.length)];

    const genreInfo = this.questionsData.genres[genreKey];
    
    // Pick question for this genre
    const candidates = (this.questionsData.questions || []).filter(q => q.genre === genreKey);
    const chosenQuestion = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : {
          id: `r1_${genreKey.toLowerCase()}_default`,
          genre: genreKey,
          genreName: genreInfo?.name || genreKey,
          badPrompt: `Create a solution for ${genreInfo?.name || "this domain"}.`,
          context: "General scenario",
          missingElements: ["Clarity", "Context", "Format"]
        };

    team.spinResult = genreKey;
    team.assignedGenre = genreInfo;
    team.assignedQuestion = chosenQuestion;
    team.submissionStatus = 'drafting';
    this.saveSnapshot();
    return team;
  }

  saveDraft(teamId, draftText) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (team.submissionStatus === 'submitted' || team.submissionStatus === 'evaluated') {
      return team; // Cannot edit after submit
    }
    team.draftPrompt = (draftText || "").slice(0, 2500);
    return team;
  }

  submitPrompt(teamId, improvedPrompt) {
    const team = this.teams.get(teamId);
    if (!team) throw new Error("Team not found");
    if (this.roundState.isLocked && this.roundState.status !== 'ACTIVE') {
      throw new Error("Round submission window is closed.");
    }
    if (team.submissionStatus === 'submitted' || team.submissionStatus === 'evaluated') {
      throw new Error("You have already submitted. Cannot edit further.");
    }

    const text = (improvedPrompt || team.draftPrompt || "").trim();
    if (text.length < 50) {
      throw new Error("Prompt must be at least 50 characters.");
    }
    if (text.length > 2500) {
      throw new Error("Prompt exceeds maximum 2500 characters.");
    }

    const elapsed = this.roundState.timerDuration - this.roundState.timerRemaining;
    team.submittedPrompt = text;
    team.submittedAt = Date.now();
    team.timerUsedSeconds = Math.max(1, elapsed);
    team.editCount = 1;
    team.submissionStatus = 'submitted';
    
    this.saveSnapshot();
    return team;
  }

  // --- Host Control Actions ---

  unlockRound() {
    this.roundState.isLocked = false;
    this.roundState.status = 'ACTIVE';
    this.startTimer();
    this.saveSnapshot();
    return this.roundState;
  }

  lockRound() {
    this.roundState.isLocked = true;
    this.roundState.status = 'LOCKED';
    this.pauseTimer();
    this.saveSnapshot();
    return this.roundState;
  }

  startTimer() {
    if (!this.roundState.timerRunning) {
      this.roundState.timerRunning = true;
      this.roundState.timerStartedAt = Date.now();
      this.roundState.timerEndsAt = Date.now() + (this.roundState.timerRemaining * 1000);
    }
    return this.roundState;
  }

  pauseTimer() {
    if (this.roundState.timerRunning) {
      this.roundState.timerRunning = false;
      this.roundState.timerStartedAt = null;
      this.roundState.timerEndsAt = null;
    }
    return this.roundState;
  }

  resetTimer(durationSeconds = 600) {
    this.roundState.timerDuration = durationSeconds;
    this.roundState.timerRemaining = durationSeconds;
    this.roundState.timerRunning = false;
    this.roundState.timerStartedAt = null;
    this.roundState.timerEndsAt = null;
    this.saveSnapshot();
    return this.roundState;
  }

  addTime(seconds = 60) {
    this.roundState.timerRemaining += seconds;
    this.roundState.timerDuration += seconds;
    if (this.roundState.timerRunning) {
      this.roundState.timerEndsAt += (seconds * 1000);
    }
    return this.roundState;
  }

  tickTimer() {
    if (this.roundState.timerRunning && this.roundState.timerRemaining > 0) {
      this.roundState.timerRemaining -= 1;
      if (this.roundState.timerRemaining <= 0) {
        this.roundState.timerRemaining = 0;
        this.roundState.timerRunning = false;
        this.roundState.status = 'EVALUATING';
      }
      return true;
    }
    return false;
  }

  setEvaluationResults(teamEvaluations) {
    // teamEvaluations: { [teamId]: evaluationObject }
    Object.entries(teamEvaluations).forEach(([teamId, evalResult]) => {
      const team = this.teams.get(teamId);
      if (team) {
        team.evaluation = evalResult;
        team.submissionStatus = 'evaluated';
      }
    });

    this.roundState.status = 'EVALUATED';
    this.computeLeaderboard();
    this.saveSnapshot();
  }

  setManualScore(teamId, criteriaKey, score) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (!team.evaluation) {
      team.evaluation = {
        clarity_score: 0,
        context_score: 0,
        constraints_score: 0,
        format_score: 0,
        creativity_score: 0,
        total_score: 0,
        reasoning: "Manually adjusted by Host",
        strengths: [],
        improvements: []
      };
    }
    if (criteriaKey in team.evaluation) {
      team.evaluation[criteriaKey] = Number(score);
    } else if (criteriaKey === 'total_score') {
      team.evaluation.total_score = Number(score);
    }

    team.evaluation.total_score = 
      (team.evaluation.clarity_score || 0) +
      (team.evaluation.context_score || 0) +
      (team.evaluation.constraints_score || 0) +
      (team.evaluation.format_score || 0) +
      (team.evaluation.creativity_score || 0);

    this.computeLeaderboard();
    this.saveSnapshot();
    return team;
  }

  computeLeaderboard() {
    const teamsList = Array.from(this.teams.values());
    
    // Sort primarily by score desc, secondarily by speed (timerUsedSeconds asc)
    teamsList.sort((a, b) => {
      const scoreA = a.evaluation?.total_score ?? -1;
      const scoreB = b.evaluation?.total_score ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a.timerUsedSeconds || 9999) - (b.timerUsedSeconds || 9999);
    });

    const totalActiveTeams = teamsList.filter(t => t.submissionStatus !== 'idle' || t.submittedPrompt).length || teamsList.length;
    const qualifyCount = Math.max(1, Math.ceil(totalActiveTeams * ((100 - this.roundState.eliminationPercentage) / 100)));

    teamsList.forEach((team, idx) => {
      team.rank = idx + 1;
      if (idx < qualifyCount && (team.evaluation?.total_score > 0 || team.submittedPrompt)) {
        team.isQualified = true;
        team.isEliminated = false;
      } else {
        team.isQualified = false;
        team.isEliminated = true;
      }
    });

    return teamsList;
  }

  advanceRound() {
    this.computeLeaderboard();
    this.roundState.status = 'ADVANCED';
    this.roundState.advanceTriggered = true;
    this.saveSnapshot();
    return {
      roundState: this.roundState,
      leaderboard: this.getLeaderboard()
    };
  }

  resetAll() {
    this.roundState = {
      round: 1,
      roundName: "PROMPT MAKEOVER",
      tagline: "SPIN. UNLOCK. REWRITE.",
      isLocked: true,
      status: 'LOCKED',
      timerDuration: 600,
      timerRemaining: 600,
      timerRunning: false,
      timerStartedAt: null,
      timerEndsAt: null,
      eliminationPercentage: 50,
      advanceTriggered: false
    };

    this.teams.clear();
    this.initTeams();
    this.saveSnapshot();
  }

  // --- Views & Payloads ---

  getTeamView(teamId) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    return {
      team: {
        id: team.id,
        name: team.name,
        spinResult: team.spinResult,
        assignedGenre: team.assignedGenre,
        assignedQuestion: team.assignedQuestion,
        draftPrompt: team.draftPrompt,
        submittedPrompt: team.submittedPrompt,
        submittedAt: team.submittedAt,
        timerUsedSeconds: team.timerUsedSeconds,
        editCount: team.editCount,
        submissionStatus: team.submissionStatus,
        evaluation: this.roundState.advanceTriggered ? team.evaluation : null,
        isQualified: this.roundState.advanceTriggered ? team.isQualified : null,
        isEliminated: this.roundState.advanceTriggered ? team.isEliminated : null,
        rank: this.roundState.advanceTriggered ? team.rank : null
      },
      roundState: {
        round: this.roundState.round,
        roundName: this.roundState.roundName,
        tagline: this.roundState.tagline,
        isLocked: this.roundState.isLocked,
        status: this.roundState.status,
        timerDuration: this.roundState.timerDuration,
        timerRemaining: this.roundState.timerRemaining,
        timerRunning: this.roundState.timerRunning,
        timerEndsAt: this.roundState.timerEndsAt,
        advanceTriggered: this.roundState.advanceTriggered
      },
      genres: this.questionsData.genres
    };
  }

  getHostView() {
    const teamsList = Array.from(this.teams.values());
    const submittedCount = teamsList.filter(t => t.submissionStatus === 'submitted' || t.submissionStatus === 'evaluated').length;
    const connectedCount = teamsList.filter(t => t.connected).length;
    const draftingCount = teamsList.filter(t => t.submissionStatus === 'drafting').length;

    return {
      roundState: this.roundState,
      stats: {
        totalTeams: teamsList.length,
        connectedCount,
        draftingCount,
        submittedCount
      },
      teams: teamsList,
      questions: this.questionsData.questions,
      genres: this.questionsData.genres
    };
  }

  getProjectorView() {
    const teamsList = Array.from(this.teams.values());
    const submittedCount = teamsList.filter(t => t.submissionStatus === 'submitted' || t.submissionStatus === 'evaluated').length;
    const connectedCount = teamsList.filter(t => t.connected).length;

    return {
      roundState: this.roundState,
      stats: {
        totalTeams: teamsList.length,
        connectedCount,
        submittedCount
      },
      leaderboard: this.roundState.advanceTriggered ? this.getLeaderboard().slice(0, 15) : []
    };
  }

  getLeaderboard() {
    const list = Array.from(this.teams.values());
    list.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    return list;
  }
}
