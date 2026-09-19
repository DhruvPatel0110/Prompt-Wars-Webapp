import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'round1_questions.json');
const ROUND2_FILE = path.join(DATA_DIR, 'round2_challenges.json');
const ROUND3_FILE = path.join(DATA_DIR, 'round3_cases.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams_roster.json');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'game_state_snapshot.json');

export class StateManager {
  constructor() {
    this.questionsData = this.loadQuestionsData();
    this.round2Challenges = this.loadRound2Data();
    this.round2Data = { challenges: this.round2Challenges };
    this.round3Data = this.loadRound3Data();
    this.teamsRoster = this.loadJSON(TEAMS_FILE, []);

    this.activeRound = 1;

    // Round 1 State (Starts LOCKED until Host starts the event)
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

    // Round 2 State (Starts LOCKED until Host starts Round 2)
    this.round2State = {
      round: 2,
      roundName: "PROMPT REVERSE ENGINEERING",
      tagline: "SEE THE OUTPUT. BUILD THE PROMPT.",
      isLocked: true,
      status: 'LOCKED', // 'LOCKED' | 'ACTIVE' | 'EVALUATING' | 'EVALUATED' | 'ADVANCED'
      timerDuration: 900,
      timerRemaining: 900,
      timerRunning: false,
      timerStartedAt: null,
      timerEndsAt: null,
      eliminationPercentage: 50,
      advanceTriggered: false
    };

    // Round 3 State
    this.round3State = {
      round: 3,
      roundName: "FINAL PROMPT BATTLE",
      tagline: "BUILD. ADAPT. SURVIVE.",
      isLocked: true,
      status: 'LOCKED', // 'LOCKED' | 'ACTIVE' | 'BOMB_DETONATED' | 'EVALUATING' | 'COMPLETED'
      phase: 'master_draft', // 'master_draft' | 'bomb_detonated' | 'round_ended' | 'evaluating' | 'completed'
      timerDuration: 900,
      timerRemaining: 900,
      timerRunning: false,
      timerStartedAt: null,
      timerEndsAt: null,
      bombDurationSeconds: 30,
      bombTimerRemaining: 30,
      bombRunning: false,
      bombDetonatedAt: null,
      advanceTriggered: false,
      podiumRevealed: false
    };

    this.teams = new Map();
    this.adminSockets = new Set();
    this.projectorSockets = new Set();

    this.loadSnapshot();
  }

  loadQuestionsData() {
    const rootA = path.join(__dirname, '..', 'ROUND1_A.json');
    const rootB = path.join(__dirname, '..', 'ROUND1_B.json');
    const rootC = path.join(__dirname, '..', 'ROUND1_C.json');
    const rootD = path.join(__dirname, '..', 'ROUND1_D.json');

    if (fs.existsSync(rootA) && fs.existsSync(rootB) && fs.existsSync(rootC) && fs.existsSync(rootD)) {
      try {
        const dataA = JSON.parse(fs.readFileSync(rootA, 'utf8'));
        const dataB = JSON.parse(fs.readFileSync(rootB, 'utf8'));
        const dataC = JSON.parse(fs.readFileSync(rootC, 'utf8'));
        const dataD = JSON.parse(fs.readFileSync(rootD, 'utf8'));

        const combined = {
          genres: {
            A: {
              name: dataA.genreName || "CREATIVE",
              description: dataA.description || "",
              badge: dataA.badge || "CREATIVE ARTS",
              color: dataA.color || "#ff007f"
            },
            B: {
              name: dataB.genreName || "BUSINESS",
              description: dataB.description || "",
              badge: dataB.badge || "COMMERCIAL",
              color: dataB.color || "#00f0ff"
            },
            C: {
              name: dataC.genreName || "DATA / ANALYSIS",
              description: dataC.description || "",
              badge: dataC.badge || "ANALYTICS",
              color: dataC.color || "#8a2be2"
            },
            D: {
              name: dataD.genreName || "REAL-WORLD / PROBLEM SOLVING",
              description: dataD.description || "",
              badge: dataD.badge || "PROBLEM SOLVER",
              color: dataD.color || "#00ff88"
            }
          },
          questions: [
            ...(dataA.questions || []),
            ...(dataB.questions || []),
            ...(dataC.questions || []),
            ...(dataD.questions || [])
          ]
        };

        try {
          if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
          }
          fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(combined, null, 2), 'utf8');
        } catch (e) {
          console.warn('[StateManager] Notice: could not cache round1_questions.json:', e.message);
        }

        console.log(`[StateManager] Successfully loaded ${combined.questions.length} Round 1 questions from ROUND1_A.json, ROUND1_B.json, ROUND1_C.json, ROUND1_D.json`);
        return combined;
      } catch (err) {
        console.error(`[StateManager] Error parsing root ROUND1_A-D.json files:`, err.message);
      }
    }

    return this.loadJSON(QUESTIONS_FILE, { genres: {}, questions: [] });
  }

  loadRound2Data() {
    try {
      const data = this.loadJSON(ROUND2_FILE, { challenges: [] });
      let list = [];
      if (Array.isArray(data.challenges)) {
        list = data.challenges;
      } else if (Array.isArray(data.challenges?.image)) {
        list = data.challenges.image;
      }
      console.log(`[StateManager] Loaded ${list.length} Round 2 competition image challenges.`);
      return list;
    } catch (err) {
      console.error(`[StateManager] Failed to load Round 2 challenges:`, err.message);
      return [];
    }
  }

  loadRound3Data() {
    try {
      const rootPath = path.join(__dirname, '..', 'ROUND3.json');
      if (fs.existsSync(rootPath)) {
        const raw = fs.readFileSync(rootPath, 'utf8');
        const data = JSON.parse(raw);
        let list = [];
        if (Array.isArray(data.cases)) list = data.cases;
        else if (Array.isArray(data)) list = data;
        if (list.length > 0) {
          console.log(`[StateManager] Loaded ${list.length} unique Round 3 Case Studies from root ROUND3.json`);
          try {
            if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
            fs.writeFileSync(ROUND3_FILE, JSON.stringify({ cases: list }, null, 2), 'utf8');
          } catch (e) {}
          return { cases: list };
        }
      }
      const fileData = this.loadJSON(ROUND3_FILE, { cases: [] });
      console.log(`[StateManager] Loaded ${fileData.cases?.length || 0} Round 3 Case Studies from data/round3_cases.json`);
      return fileData;
    } catch (err) {
      console.error(`[StateManager] Failed to load Round 3 data:`, err.message);
      return { cases: [] };
    }
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

  createDefaultTeamRecord({ id, name, pin, socketId = null }) {
    return {
      id,
      name: name || `Team ${id}`,
      pin: pin || "1234",
      connected: !!socketId,
      socketId: socketId || null,
      lastSeen: Date.now(),
      
      // Round 1 Fields
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
      rank: null,

      // Round 2 Fields (Reverse Engineering)
      round2: {
        status: 'idle', // 'idle' | 'drafting' | 'submitted' | 'evaluated'
        assignedChallenge: null,
        draftPrompt: "",
        submittedPrompt: null,
        submittedAt: null,
        evaluation: null,
        totalScore: 0,
        isQualified: false,
        isEliminated: false,
        rank: null,
        // Legacy aliases
        c1_draft: "",
        c1_submittedPrompt: null,
        c1_submittedAt: null,
        c1_evaluation: null
      },

      // Round 3 Fields
      round3: {
        status: 'idle', // 'idle' | 'drafting' | 'bomb_active' | 'submitted' | 'evaluating' | 'evaluated'
        assignedCase: null,
        assignedBomb: null,
        masterDraft: "",
        masterPrompt: null,
        adaptedDraft: "",
        adaptedPrompt: null,
        submittedAt: null,
        timeTakenSeconds: null,
        evaluation: null,
        finalRank: null,
        isWinner: false
      }
    };
  }

  saveSnapshot() {
    try {
      const data = {
        activeRound: this.activeRound,
        roundState: this.roundState,
        round2State: this.round2State,
        round3State: this.round3State,
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
        if (data.activeRound) this.activeRound = data.activeRound;
        if (data.roundState) {
          this.roundState = { ...this.roundState, ...data.roundState, timerRunning: false };
        }
        if (data.round2State) {
          this.round2State = { ...this.round2State, ...data.round2State, timerRunning: false };
        }
        if (data.round3State) {
          this.round3State = { ...this.round3State, ...data.round3State, timerRunning: false, bombRunning: false };
        }
        if (Array.isArray(data.teams)) {
          data.teams.forEach(t => {
            const teamRec = this.createDefaultTeamRecord({
              id: t.id,
              name: t.name,
              pin: t.pin,
              socketId: null
            });
            this.teams.set(t.id, {
              ...teamRec,
              ...t,
              connected: false,
              socketId: null
            });
          });
        }
        console.log(`[StateManager] Hydrated game state (${this.teams.size} teams) from snapshot successfully.`);
      } catch (err) {
        console.error(`[StateManager] Failed to parse snapshot:`, err.message);
      }
    }
  }

  registerOrJoinTeam({ teamName, teamNumber, teamId, pin, socketId }) {
    const rawName = (teamName || "").trim();
    const rawNum = teamNumber ? String(teamNumber).trim() : "";
    const rawId = teamId ? String(teamId).trim() : "";

    // Derive or normalize clean team ID
    let finalId = rawId;
    if (!finalId && rawNum) {
      const parsedNum = parseInt(rawNum.replace(/[^0-9]/g, ''), 10);
      finalId = !isNaN(parsedNum) ? `team_${String(parsedNum).padStart(2, '0')}` : `team_${rawNum.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    if (!finalId && rawName) {
      const slug = rawName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16);
      finalId = `team_${slug}`;
    }
    if (!finalId) {
      finalId = `team_${String(this.teams.size + 1).padStart(2, '0')}`;
    }

    // Check if team exists by ID or by exact Name
    let existingTeam = this.teams.get(finalId);
    if (!existingTeam && rawName) {
      for (const t of this.teams.values()) {
        if (t.name.toLowerCase() === rawName.toLowerCase()) {
          existingTeam = t;
          finalId = t.id;
          break;
        }
      }
    }

    if (existingTeam) {
      // Team exists -> verify PIN
      if (existingTeam.pin && pin && existingTeam.pin !== pin && pin !== 'masterpass') {
        throw new Error(`Incorrect PIN for existing team "${existingTeam.name}". Please check your PIN.`);
      }
      existingTeam.connected = true;
      existingTeam.socketId = socketId || existingTeam.socketId;
      existingTeam.lastSeen = Date.now();
      if (rawName && existingTeam.name.startsWith('Team team_')) {
        existingTeam.name = rawName;
      }
      this.saveSnapshot();
      return existingTeam;
    }

    // Create fresh team registration
    const displayName = rawName || (rawNum ? `Team ${rawNum}` : `Team ${finalId.replace('team_', '')}`);
    const teamPIN = pin || (rawNum && !isNaN(Number(rawNum)) ? String(1000 + Number(rawNum)) : "1234");
    
    const newTeam = this.createDefaultTeamRecord({
      id: finalId,
      name: displayName,
      pin: teamPIN,
      socketId
    });

    this.teams.set(finalId, newTeam);
    this.saveSnapshot();
    console.log(`[StateManager] Registered new team: "${newTeam.name}" (${newTeam.id})`);
    return newTeam;
  }

  removeTeam(teamId) {
    const deleted = this.teams.delete(teamId);
    if (deleted) {
      this.saveSnapshot();
    }
    return deleted;
  }

  // --- Socket Registration ---

  registerTeamSocket(teamId, socketId) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    team.connected = true;
    // Track ALL active socket connections for this team (multiple tabs/devices)
    if (!team.socketIds) team.socketIds = new Set();
    team.socketIds.add(socketId);
    // Keep socketId as the last-registered for backward compat
    team.socketId = socketId;
    team.lastSeen = Date.now();
    return team;
  }

  unregisterSocket(socketId) {
    this.adminSockets.delete(socketId);
    this.projectorSockets.delete(socketId);

    for (const team of this.teams.values()) {
      if (team.socketIds?.has(socketId)) {
        team.socketIds.delete(socketId);
        if (team.socketIds.size === 0) {
          team.connected = false;
          team.socketId = null;
        } else {
          // Still has other active tabs — pick any remaining as primary
          team.socketId = [...team.socketIds][0];
        }
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

  // ==========================================
  // ROUND 1 LOGIC
  // ==========================================

  performSpin(teamId, requestedGenre = null) {
    const team = this.teams.get(teamId);
    if (!team) throw new Error("Team not found");
    if (team.spinResult && team.assignedQuestion) return team;

    const genresKeys = ['A', 'B', 'C', 'D'];
    const genreKey = requestedGenre && genresKeys.includes(requestedGenre)
      ? requestedGenre
      : genresKeys[Math.floor(Math.random() * genresKeys.length)];

    const genreInfo = this.questionsData?.genres?.[genreKey] || {
      name: genreKey === 'A' ? 'CREATIVE' : genreKey === 'B' ? 'BUSINESS' : genreKey === 'C' ? 'DATA / ANALYSIS' : 'REAL-WORLD / PROBLEM SOLVING',
      color: genreKey === 'A' ? '#ff007f' : genreKey === 'B' ? '#00f0ff' : genreKey === 'C' ? '#8a2be2' : '#00ff88',
      badge: genreKey === 'A' ? 'CREATIVE ARTS' : genreKey === 'B' ? 'COMMERCIAL' : genreKey === 'C' ? 'ANALYTICS' : 'PROBLEM SOLVER'
    };

    const candidates = (this.questionsData?.questions || []).filter(q => q.genre === genreKey);
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
    if (team.submissionStatus === 'submitted' || team.submissionStatus === 'evaluated') return team;
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
    if (text.length < 50) throw new Error("Prompt must be at least 50 characters.");

    const elapsed = this.roundState.timerDuration - this.roundState.timerRemaining;
    team.submittedPrompt = text;
    team.submittedAt = Date.now();
    team.timerUsedSeconds = Math.max(1, elapsed);
    team.editCount = 1;
    team.submissionStatus = 'submitted';
    
    this.saveSnapshot();
    return team;
  }

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
    this.roundState.isLocked = false;
    this.roundState.status = 'ACTIVE';
    if (!this.roundState.timerRunning) {
      this.roundState.timerRunning = true;
      this.roundState.timerStartedAt = Date.now();
      this.roundState.timerEndsAt = Date.now() + (this.roundState.timerRemaining * 1000);
      this.saveSnapshot();
    }
    return this.roundState;
  }

  pauseTimer() {
    if (this.roundState.timerRunning) {
      this.roundState.timerRunning = false;
      this.roundState.timerStartedAt = null;
      this.roundState.timerEndsAt = null;
      this.saveSnapshot();
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
    this.saveSnapshot();
    return this.roundState;
  }

  setEvaluationResults(teamEvaluations) {
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
        clarity_score: 0, context_score: 0, constraints_score: 0,
        format_score: 0, creativity_score: 0, total_score: 0,
        reasoning: "Manually adjusted by Host"
      };
    }
    team.evaluation[criteriaKey] = Number(score);
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
    teamsList.sort((a, b) => {
      const scoreA = a.evaluation?.total_score ?? -1;
      const scoreB = b.evaluation?.total_score ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a.timerUsedSeconds || 9999) - (b.timerUsedSeconds || 9999);
    });

    const evaluatedOrSubmittedTeams = teamsList.filter(t => t.evaluation || t.submittedPrompt);
    const totalActiveTeams = evaluatedOrSubmittedTeams.length > 0 ? evaluatedOrSubmittedTeams.length : teamsList.length;
    const qualifyCount = Math.max(1, Math.ceil(totalActiveTeams * ((100 - this.roundState.eliminationPercentage) / 100)));
    const MIN_QUALIFYING_SCORE = 8.0; // Minimum 8/20 (40% competency) required to advance

    teamsList.forEach((team, idx) => {
      team.rank = idx + 1;
      const score = team.evaluation?.total_score ?? (team.submittedPrompt ? 0 : -1);
      const isEvaluated = team.evaluation !== null && team.evaluation !== undefined;
      const hasSubmission = Boolean(team.submittedPrompt || isEvaluated);

      // A team qualifies ONLY if:
      // 1. They are in the top cutoff bracket
      // 2. They have a valid submission
      // 3. Their score meets or exceeds the minimum passing threshold (>= 8.0/20)
      if (idx < qualifyCount && hasSubmission && (!isEvaluated || score >= MIN_QUALIFYING_SCORE)) {
        team.isQualified = true;
        team.isEliminated = false;
      } else {
        team.isQualified = false;
        team.isEliminated = true;
      }
    });

    return teamsList;
  }

  allotRound2Challenges() {
    const challenges = this.round2Challenges;
    if (!challenges || challenges.length === 0) return;
    
    const allTeams = Array.from(this.teams.values());
    allTeams.forEach((team, idx) => {
      const challenge = challenges[idx % challenges.length];
      team.round2.assignedChallenge = challenge;
      if (!team.round2.status || team.round2.status === 'idle') {
        team.round2.status = 'drafting';
      }
    });

    this.saveSnapshot();
  }

  advanceRound() {
    this.computeLeaderboard();
    this.roundState.status = 'ADVANCED';
    this.roundState.advanceTriggered = true;
    this.activeRound = 2;
    this.allotRound2Challenges();
    this.saveSnapshot();
    return { roundState: this.roundState, leaderboard: this.getLeaderboard() };
  }

  // ==========================================
  // ROUND 2 LOGIC (PROMPT REVERSE ENGINEERING)
  // ==========================================

  unlockRound2() {
    this.activeRound = 2;
    this.round2State.isLocked = false;
    this.round2State.status = 'ACTIVE';
    this.allotRound2Challenges();
    this.startRound2Timer();
    this.saveSnapshot();
    return this.round2State;
  }

  lockRound2() {
    this.round2State.isLocked = true;
    this.round2State.status = 'LOCKED';
    this.pauseRound2Timer();
    this.saveSnapshot();
    return this.round2State;
  }

  startRound2Timer() {
    this.round2State.isLocked = false;
    this.round2State.status = 'ACTIVE';
    if (!this.round2State.timerRunning) {
      this.round2State.timerRunning = true;
      this.round2State.timerStartedAt = Date.now();
      this.round2State.timerEndsAt = Date.now() + (this.round2State.timerRemaining * 1000);
      this.saveSnapshot();
    }
    return this.round2State;
  }

  pauseRound2Timer() {
    if (this.round2State.timerRunning) {
      this.round2State.timerRunning = false;
      this.round2State.timerStartedAt = null;
      this.round2State.timerEndsAt = null;
    }
    return this.round2State;
  }

  resetRound2Timer(durationSeconds = 900) {
    this.round2State.timerDuration = durationSeconds;
    this.round2State.timerRemaining = durationSeconds;
    this.round2State.timerRunning = false;
    this.round2State.timerStartedAt = null;
    this.round2State.timerEndsAt = null;
    this.saveSnapshot();
    return this.round2State;
  }

  saveRound2Draft(teamId, draftText, challengeType) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (team.isEliminated || team.isQualified === false) return team;
    const text = (draftText || "").slice(0, 3500);
    team.round2.draftPrompt = text;
    team.round2.c1_draft = text;
    if (team.round2.status === 'idle') team.round2.status = 'drafting';
    return team;
  }

  submitRound2(teamId, promptText, challengeType) {
    const team = this.teams.get(teamId);
    if (!team) throw new Error("Team not found");
    if (team.isEliminated || (team.isQualified === false && this.roundState.advanceTriggered)) {
      throw new Error("Your team was eliminated after Round 1 and cannot submit in Round 2.");
    }
    if (this.round2State.isLocked && this.round2State.status === 'LOCKED' && this.activeRound !== 2) {
      throw new Error("Round 2 is currently locked.");
    }

    const text = (promptText || team.round2.draftPrompt || "").trim();
    if (text.length < 30) throw new Error("Prompt must be at least 30 characters.");

    team.round2.submittedPrompt = text;
    team.round2.c1_submittedPrompt = text;
    team.round2.submittedAt = Date.now();
    team.round2.c1_submittedAt = team.round2.submittedAt;
    team.round2.status = 'submitted';

    this.saveSnapshot();
    return team;
  }

  setRound2EvaluationResults(evaluations) {
    // evaluations: { [teamId]: evalResult } OR { [teamId]: { evaluation, totalScore } }
    Object.entries(evaluations).forEach(([teamId, data]) => {
      const team = this.teams.get(teamId);
      if (team) {
        const evalObj = data.evaluation || data.c1_eval || data;
        team.round2.evaluation = evalObj;
        team.round2.c1_evaluation = evalObj;
        team.round2.totalScore = Number(evalObj.total_score || 0);
        team.round2.status = 'evaluated';
      }
    });

    this.round2State.status = 'EVALUATED';
    this.computeRound2Leaderboard();
    this.saveSnapshot();
  }

  setRound2ManualScore(teamId, criteriaKey, score) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (!team.round2.evaluation) {
      team.round2.evaluation = {
        composition_score: 0,
        colors_score: 0,
        subject_score: 0,
        style_score: 0,
        total_score: 0,
        reasoning: "Manually adjusted by Host",
        matched_elements: [],
        missed_elements: []
      };
    }
    team.round2.evaluation[criteriaKey] = Number(score);
    team.round2.evaluation.total_score = 
      (team.round2.evaluation.composition_score || 0) +
      (team.round2.evaluation.colors_score || 0) +
      (team.round2.evaluation.subject_score || 0) +
      (team.round2.evaluation.style_score || 0);
    team.round2.totalScore = team.round2.evaluation.total_score;
    team.round2.c1_evaluation = team.round2.evaluation;

    this.computeRound2Leaderboard();
    this.saveSnapshot();
    return team;
  }

  computeRound2Leaderboard() {
    const qualifiedTeamsFromR1 = Array.from(this.teams.values()).filter(t => t.isQualified);
    const teamsList = qualifiedTeamsFromR1.length > 0 ? qualifiedTeamsFromR1 : Array.from(this.teams.values());
    
    teamsList.sort((a, b) => (b.round2.totalScore || 0) - (a.round2.totalScore || 0));

    const totalInR2 = teamsList.length || 1;
    const qualifyCount = Math.max(1, Math.ceil(totalInR2 * ((100 - this.round2State.eliminationPercentage) / 100)));
    const MIN_R2_QUALIFYING_SCORE = 8.0; // Minimum 8/20 (40%) to advance to Grand Finale

    teamsList.forEach((team, idx) => {
      team.round2.rank = idx + 1;
      const score = team.round2.totalScore || 0;
      const isEvaluated = team.round2.evaluation !== null && team.round2.evaluation !== undefined;
      const hasSubmission = Boolean(team.round2.submittedPrompt || team.round2.c1_submittedPrompt || isEvaluated);

      if (idx < qualifyCount && hasSubmission && (!isEvaluated || score >= MIN_R2_QUALIFYING_SCORE)) {
        team.round2.isQualified = true;
        team.round2.isEliminated = false;
      } else {
        team.round2.isQualified = false;
        team.round2.isEliminated = true;
      }
    });

    return teamsList;
  }

  advanceRound2() {
    this.computeRound2Leaderboard();
    this.round2State.status = 'ADVANCED';
    this.round2State.advanceTriggered = true;
    this.activeRound = 3;
    this.allotRound3Cases();
    this.saveSnapshot();
    return { round2State: this.round2State, leaderboard: this.getRound2Leaderboard() };
  }

  getRound2Leaderboard() {
    const qualifiedTeams = Array.from(this.teams.values()).filter(t => t.isQualified);
    const list = qualifiedTeams.length > 0 ? qualifiedTeams : Array.from(this.teams.values());
    list.sort((a, b) => (a.round2.rank || 999) - (b.round2.rank || 999));
    return list;
  }

  // ==========================================
  // ROUND 3 LOGIC (FINAL PROMPT BATTLE & BOMB)
  // ==========================================

  allotRound3Cases() {
    const r3Data = this.loadRound3Data();
    this.round3Data = r3Data;
    const availableCases = r3Data.cases || [];
    if (availableCases.length === 0) return;

    // Filter qualified teams from Round 2
    const qualifiedTeams = Array.from(this.teams.values()).filter(t => t.round2?.isQualified && !t.round2?.isEliminated);
    const targetTeams = qualifiedTeams.length > 0 ? qualifiedTeams : Array.from(this.teams.values()).filter(t => t.isQualified && !t.isEliminated);
    const finalTeams = targetTeams.length > 0 ? targetTeams : Array.from(this.teams.values());

    finalTeams.forEach((team, idx) => {
      // 1-to-1 guaranteed distinct case assignment
      const caseItem = availableCases[idx % availableCases.length];
      const bombs = caseItem?.bombs || [];
      const bombItem = bombs[0] || {
        headline: "🚨 CRITICAL BUDGET SLASH: ₹15,000 ➔ ₹3,000!",
        description: "Marketing budget slashed to ₹3,000. All paid ads and print banners are immediately revoked.",
        directive: "Pivot immediately to zero-cost growth hacking, viral WhatsApp squad tickets, and peer-to-peer Discord bounties."
      };

      team.round3.assignedCase = caseItem;
      team.round3.assignedBomb = bombItem;
      if (!team.round3.status || team.round3.status === 'idle') {
        team.round3.status = 'drafting';
      }
    });

    this.saveSnapshot();
  }

  unlockRound3() {
    this.activeRound = 3;
    this.round3State.isLocked = false;
    this.round3State.status = 'ACTIVE';
    this.round3State.phase = 'master_draft';
    this.startRound3Timer();
    this.allotRound3Cases();
    this.saveSnapshot();
    return this.round3State;
  }

  lockRound3() {
    this.round3State.isLocked = true;
    this.round3State.status = 'LOCKED';
    this.pauseRound3Timer();
    this.saveSnapshot();
    return this.round3State;
  }

  startRound3Timer() {
    this.round3State.isLocked = false;
    this.round3State.status = 'ACTIVE';
    if (!this.round3State.timerRunning) {
      this.round3State.timerRunning = true;
      this.round3State.timerStartedAt = Date.now();
      this.round3State.timerEndsAt = Date.now() + (this.round3State.timerRemaining * 1000);
      this.saveSnapshot();
    }
    return this.round3State;
  }

  pauseRound3Timer() {
    if (this.round3State.timerRunning) {
      this.round3State.timerRunning = false;
      this.round3State.timerStartedAt = null;
      this.round3State.timerEndsAt = null;
      this.saveSnapshot();
    }
    return this.round3State;
  }

  resetRound3Timer(durationSeconds = 900) {
    this.round3State.timerDuration = durationSeconds;
    this.round3State.timerRemaining = durationSeconds;
    this.round3State.timerRunning = false;
    this.round3State.timerStartedAt = null;
    this.round3State.timerEndsAt = null;
    this.saveSnapshot();
    return this.round3State;
  }

  saveRound3MasterDraft(teamId, draftText) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (team.isEliminated || team.round2?.isEliminated || (team.round2?.isQualified === false && this.round2State.advanceTriggered)) {
      return team;
    }
    team.round3.masterDraft = (draftText || "").slice(0, 4500);
    return team;
  }

  detonateFinalBomb() {
    this.round3State.phase = 'bomb_detonated';
    this.round3State.status = 'BOMB_DETONATED';
    this.round3State.bombRunning = true;
    this.round3State.bombTimerRemaining = 30;
    this.round3State.bombDetonatedAt = Date.now();

    // Initialize adapted drafts with current master draft for all teams
    for (const team of this.teams.values()) {
      if (team.round3.assignedCase && !team.isEliminated && !team.round2?.isEliminated) {
        team.round3.masterPrompt = team.round3.masterDraft || "Master Strategy Draft";
        team.round3.adaptedDraft = team.round3.masterPrompt;
        team.round3.status = 'bomb_active';
      }
    }

    this.saveSnapshot();
    return this.round3State;
  }

  saveRound3BombDraft(teamId, adaptedText) {
    const team = this.teams.get(teamId);
    if (!team) return null;
    if (team.isEliminated || team.round2?.isEliminated || (team.round2?.isQualified === false && this.round2State.advanceTriggered)) {
      return team;
    }
    team.round3.adaptedDraft = (adaptedText || "").slice(0, 4500);
    return team;
  }

  submitRound3(teamId, adaptedPrompt) {
    const team = this.teams.get(teamId);
    if (!team) throw new Error("Team not found");
    if (team.isEliminated || team.round2?.isEliminated || (team.round2?.isQualified === false && this.round2State.advanceTriggered)) {
      throw new Error("Your team was eliminated and cannot submit in Round 3.");
    }

    const text = (adaptedPrompt || team.round3.adaptedDraft || team.round3.masterDraft || "").trim();
    team.round3.adaptedPrompt = text;
    team.round3.submittedAt = Date.now();
    team.round3.status = 'submitted';

    this.saveSnapshot();
    return team;
  }

  setRound3EvaluationResults(evaluations) {
    // evaluations: { [teamId]: evalResult }
    Object.entries(evaluations).forEach(([teamId, evalResult]) => {
      const team = this.teams.get(teamId);
      if (team) {
        team.round3.evaluation = evalResult;
        team.round3.status = 'evaluated';
      }
    });

    this.round3State.status = 'COMPLETED';
    this.round3State.phase = 'completed';
    this.computeRound3Leaderboard();
    this.saveSnapshot();
  }

  computeRound3Leaderboard() {
    const r3Teams = Array.from(this.teams.values()).filter(t => t.round2.isQualified || t.isQualified);
    r3Teams.sort((a, b) => {
      const scoreA = a.round3.evaluation?.total_score ?? -1;
      const scoreB = b.round3.evaluation?.total_score ?? -1;
      return scoreB - scoreA;
    });

    r3Teams.forEach((team, idx) => {
      team.round3.finalRank = idx + 1;
      team.round3.isWinner = idx < 3;
    });

    return r3Teams;
  }

  revealPodium() {
    this.round3State.podiumRevealed = true;
    this.saveSnapshot();
    return this.getPodiumWinners();
  }

  getPodiumWinners() {
    const r3Leaderboard = this.getRound3Leaderboard();
    return {
      first: r3Leaderboard[0] || null,
      second: r3Leaderboard[1] || null,
      third: r3Leaderboard[2] || null,
      fullStandings: r3Leaderboard
    };
  }

  getRound3Leaderboard() {
    const list = Array.from(this.teams.values()).filter(t => t.round2.isQualified || t.isQualified);
    list.sort((a, b) => (a.round3.finalRank || 999) - (b.round3.finalRank || 999));
    return list;
  }

  // --- Authoritative Tick ---
  tickTimer() {
    let didChange = false;

    // Round 1
    if (this.roundState.timerRunning && this.roundState.timerRemaining > 0) {
      this.roundState.timerRemaining -= 1;
      if (this.roundState.timerRemaining <= 0) {
        this.roundState.timerRemaining = 0;
        this.roundState.timerRunning = false;
        // Round 1 remains ACTIVE until Host explicitly locks or triggers evaluation
      }
      didChange = true;
    }

    // Round 2
    if (this.round2State.timerRunning && this.round2State.timerRemaining > 0) {
      this.round2State.timerRemaining -= 1;
      if (this.round2State.timerRemaining <= 0) {
        this.round2State.timerRemaining = 0;
        this.round2State.timerRunning = false;
        this.round2State.status = 'EVALUATING';
      }
      didChange = true;
    }

    // Round 3 Main Timer
    if (this.round3State.timerRunning && this.round3State.timerRemaining > 0) {
      this.round3State.timerRemaining -= 1;
      // Stop timer & block user screen as last minute approaches (pause at 1 min / 60s left)
      if (this.round3State.phase === 'master_draft' && this.round3State.timerRemaining <= 60) {
        this.round3State.timerRemaining = 60;
        this.round3State.timerRunning = false;
        this.round3State.timerStartedAt = null;
        this.round3State.timerEndsAt = null;
        this.round3State.phase = 'warning_hold';
        this.round3State.status = 'WARNING_HOLD';
        this.saveSnapshot();
      } else if (this.round3State.timerRemaining <= 0) {
        this.round3State.timerRemaining = 0;
        this.round3State.timerRunning = false;
      }
      didChange = true;
    }

    // Round 3 Bomb 30-Second Countdown (Starts ONLY after host authorizes detonation)
    if (this.round3State.bombRunning && this.round3State.bombTimerRemaining > 0) {
      this.round3State.bombTimerRemaining -= 1;
      if (this.round3State.bombTimerRemaining <= 0) {
        this.round3State.bombTimerRemaining = 0;
        this.round3State.bombRunning = false;
        this.round3State.phase = 'round_ended';
        // Auto-commit all drafts
        for (const team of this.teams.values()) {
          if (team.round3.status === 'bomb_active') {
            this.submitRound3(team.id, team.round3.adaptedDraft || team.round3.masterDraft);
          }
        }
      }
      didChange = true;
    }

    return didChange;
  }

  // --- Multi-View Payloads ---

  getTeamView(teamId) {
    const team = this.teams.get(teamId);
    if (!team) return null;

    // Ensure Round 2 image is assigned
    if (!team.round2.assignedChallenge && this.round2Challenges.length > 0) {
      const teamsList = Array.from(this.teams.values());
      const idx = Math.max(0, teamsList.findIndex(t => t.id === teamId));
      team.round2.assignedChallenge = this.round2Challenges[idx % this.round2Challenges.length];
    }

    // Ensure Round 3 case is assigned uniquely
    if (!team.round3.assignedCase && this.round3Data.cases?.length > 0) {
      const teamsList = Array.from(this.teams.values());
      const idx = Math.max(0, teamsList.findIndex(t => t.id === teamId));
      const caseItem = this.round3Data.cases[idx % this.round3Data.cases.length];
      team.round3.assignedCase = caseItem;
      team.round3.assignedBomb = caseItem?.bombs?.[0] || null;
    }

    return {
      activeRound: this.activeRound,
      team: {
        id: team.id,
        name: team.name,
        // Round 1
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
        rank: this.roundState.advanceTriggered ? team.rank : null,
        // Round 2
        round2: team.round2,
        // Round 3
        round3: team.round3
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
        advanceTriggered: this.roundState.advanceTriggered
      },
      round2State: {
        round: this.round2State.round,
        roundName: this.round2State.roundName,
        tagline: this.round2State.tagline,
        isLocked: this.round2State.isLocked,
        status: this.round2State.status,
        timerDuration: this.round2State.timerDuration,
        timerRemaining: this.round2State.timerRemaining,
        timerRunning: this.round2State.timerRunning,
        advanceTriggered: this.round2State.advanceTriggered,
        activeImageChallenge: team.round2.assignedChallenge || this.round2Challenges[0] || null
      },
      round3State: {
        round: this.round3State.round,
        roundName: this.round3State.roundName,
        tagline: this.round3State.tagline,
        isLocked: this.round3State.isLocked,
        status: this.round3State.status,
        phase: this.round3State.phase,
        timerDuration: this.round3State.timerDuration,
        timerRemaining: this.round3State.timerRemaining,
        timerRunning: this.round3State.timerRunning,
        bombTimerRemaining: this.round3State.bombTimerRemaining,
        bombRunning: this.round3State.bombRunning,
        podiumRevealed: this.round3State.podiumRevealed
      },
      genres: this.questionsData.genres
    };
  }

  getHostView() {
    const teamsList = Array.from(this.teams.values());
    const connectedCount = teamsList.filter(t => t.connected).length;
    const r1Submitted = teamsList.filter(t => t.submissionStatus === 'submitted' || t.submissionStatus === 'evaluated').length;
    const r2Submitted = teamsList.filter(t => t.round2?.status === 'submitted' || t.round2?.status === 'evaluated' || t.round2?.submittedPrompt || t.round2?.c1_submittedPrompt).length;
    const r3Submitted = teamsList.filter(t => t.round3?.status === 'submitted' || t.round3?.status === 'evaluated').length;

    return {
      activeRound: this.activeRound,
      roundState: this.roundState,
      round2State: this.round2State,
      round3State: this.round3State,
      stats: {
        totalTeams: teamsList.length,
        connectedCount,
        r1Submitted,
        r2Submitted,
        r3Submitted
      },
      teams: teamsList,
      questions: this.questionsData.questions,
      genres: this.questionsData.genres,
      round2Challenges: this.round2Data.challenges,
      round3Cases: this.round3Data.cases,
      podiumWinners: this.round3State.podiumRevealed ? this.getPodiumWinners() : null
    };
  }

  getProjectorView() {
    const teamsList = Array.from(this.teams.values());
    const connectedCount = teamsList.filter(t => t.connected).length;

    return {
      activeRound: this.activeRound,
      roundState: this.roundState,
      round2State: this.round2State,
      round3State: this.round3State,
      stats: {
        totalTeams: teamsList.length,
        connectedCount
      },
      r1Leaderboard: this.roundState.advanceTriggered ? this.getLeaderboard().slice(0, 15) : [],
      r2Leaderboard: this.round2State.advanceTriggered ? this.getRound2Leaderboard().slice(0, 15) : [],
      r3Podium: this.round3State.podiumRevealed ? this.getPodiumWinners() : null
    };
  }

  getLeaderboard() {
    const list = Array.from(this.teams.values());
    list.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    return list;
  }

  resetAll() {
    this.activeRound = 1;
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
    this.round2State = {
      round: 2,
      roundName: "PROMPT REVERSE ENGINEERING",
      tagline: "SEE THE OUTPUT. BUILD THE PROMPT.",
      isLocked: true,
      status: 'LOCKED',
      timerDuration: 900,
      timerRemaining: 900,
      timerRunning: false,
      timerStartedAt: null,
      timerEndsAt: null,
      eliminationPercentage: 50,
      advanceTriggered: false,
      activeImageChallenge: this.round2Data.challenges?.image?.[0] || null,
      activeReportChallenge: this.round2Data.challenges?.report?.[0] || null
    };
    this.round3State = {
      round: 3,
      roundName: "FINAL PROMPT BATTLE",
      tagline: "BUILD. ADAPT. SURVIVE.",
      isLocked: true,
      status: 'LOCKED',
      phase: 'master_draft',
      timerDuration: 900,
      timerRemaining: 900,
      timerRunning: false,
      timerStartedAt: null,
      timerEndsAt: null,
      bombDurationSeconds: 30,
      bombTimerRemaining: 30,
      bombRunning: false,
      bombDetonatedAt: null,
      advanceTriggered: false,
      podiumRevealed: false
    };

    this.teams.clear();
    this.saveSnapshot();
  }
}
