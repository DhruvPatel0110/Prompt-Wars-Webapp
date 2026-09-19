import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Sparkles, AlertCircle, CheckCircle2, ArrowRight, 
  Send, RefreshCw, Trophy, XCircle, FileText, HelpCircle, 
  Check, Info, ShieldCheck, Flame, Award, Layers, Lightbulb,
  PlusCircle, Wand2, Eye, Compass, FlaskConical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { WheelSpinner } from '../components/WheelSpinner';
import { StudentRound2 } from '../components/StudentRound2';
import { StudentRound3 } from '../components/StudentRound3';
import { GrandFinalePodium } from '../components/GrandFinalePodium';
import { PromptSandboxModal } from '../components/PromptSandboxModal';
import { soundEngine } from '../utils/audio';

export const StudentDashboard = () => {
  const { user, logoutTeam } = useAuth();
  const { socket, isConnected, serverTimer, teamState } = useSocket();

  const [localDraft, setLocalDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasRevealedGenre, setHasRevealedGenre] = useState(false);
  const [selectedRoundTab, setSelectedRoundTab] = useState(null);

  const autosaveTimerRef = useRef(null);

  const team = teamState?.team || {};
  const activeRound = serverTimer?.activeRound || teamState?.activeRound || 1;
  const currentViewRound = selectedRoundTab || activeRound;
  const sandboxRunsLeft = team?.sandbox?.r1RunsLeft ?? 5;

  const handleRunSandbox = ({ round, challengeType, promptText, testInput }) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket disconnected"));
      socket.emit('team:sandbox_run', {
        teamId: user?.teamId,
        round: 1,
        challengeType: 'prompt',
        promptText,
        testInput
      }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || "Sandbox execution failed."));
      });
    });
  };

  // Sync draft from server state
  useEffect(() => {
    if (team?.draftPrompt !== undefined && team?.draftPrompt !== null) {
      if (!localDraft && team.draftPrompt) {
        setLocalDraft(team.draftPrompt);
      }
    }
  }, [team]);

  // Sync spin result & listen for tournament reset
  useEffect(() => {
    setHasRevealedGenre(!!team?.spinResult);
  }, [team?.spinResult]);

  useEffect(() => {
    if (!socket) return;
    const handleTournamentReset = () => {
      setLocalDraft('');
      setHasRevealedGenre(false);
      setSelectedRoundTab(null);
      setIsSubmitting(false);
      setErrorMessage(null);
    };

    socket.on('tournament:reset', handleTournamentReset);
    return () => {
      socket.off('tournament:reset', handleTournamentReset);
    };
  }, [socket]);

  // Autosave Handler
  const handleDraftChange = (e) => {
    const text = e.target.value;
    setLocalDraft(text);
    setIsAutoSaving(true);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (socket && user?.teamId) {
        socket.emit('team:draft_update', {
          teamId: user.teamId,
          draftText: text
        });
      }
      setIsAutoSaving(false);
    }, 600);
  };

  // Wheel Spin Callback
  const handleSpinEnd = (genreId, genreData) => {
    if (socket && user?.teamId) {
      socket.emit('team:spin', { teamId: user.teamId, requestedGenre: genreId }, (res) => {
        if (!res?.success) {
          setErrorMessage(res?.error || 'Spin synchronization failed.');
        } else {
          setHasRevealedGenre(true);
        }
      });
    }
  };

  // Submit Prompt Handler
  const handleSubmitPrompt = () => {
    if (!localDraft || localDraft.trim().length < 50) {
      setErrorMessage("Your prompt must contain at least 50 characters before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setShowConfirmModal(false);

    socket.emit('team:submit', { teamId: user.teamId, improvedPrompt: localDraft }, (res) => {
      setIsSubmitting(false);
      if (res?.success) {
        soundEngine.playSubmitChime();
      } else {
        setErrorMessage(res?.error || 'Submission failed.');
      }
    });
  };

  // ----------------------------------------------------
  // SCREEN: GRAND FINALE PODIUM (Tournament Winner Reveal)
  // ----------------------------------------------------
  if (activeRound === 3 && teamState?.round3State?.podiumRevealed && !selectedRoundTab) {
    return (
      <div className="space-y-4">
        <div className="max-w-6xl mx-auto px-4 pt-4 flex justify-between items-center">
          <button
            onClick={() => setSelectedRoundTab(3)}
            className="text-xs font-mono text-cyan-400 hover:text-white flex items-center gap-1.5"
          >
            ← View Round 3 Submission Workspace
          </button>
        </div>
        <GrandFinalePodium podiumWinners={teamState?.podiumWinners} />
      </div>
    );
  }

  // ----------------------------------------------------
  // QUALIFICATION & ELIMINATION STATUS RESOLUTION
  // ----------------------------------------------------
  const isR1AdvanceTriggered = Boolean(teamState?.roundState?.advanceTriggered);
  const isR2AdvanceTriggered = Boolean(teamState?.round2State?.advanceTriggered);

  // Round 1 status
  const isR1Eliminated = isR1AdvanceTriggered && (team.isQualified === false || team.isEliminated === true);
  const isR1Qualified = isR1AdvanceTriggered && team.isQualified === true;

  // Round 2 status
  const isR2Eliminated = isR2AdvanceTriggered && (team.round2?.isQualified === false || team.round2?.isEliminated === true);
  const isR2Qualified = isR2AdvanceTriggered && team.round2?.isQualified === true && isR1Qualified;

  // ----------------------------------------------------
  // TOURNAMENT ROUND ROUTER & NAVIGATION
  // ----------------------------------------------------
  const renderRoundSwitcher = () => {
    if (!isR1AdvanceTriggered && activeRound === 1) return null;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="glass-panel p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRoundTab(1)}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                currentViewRound === 1
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
              }`}
            >
              <span>ROUND 1: MAKEOVER</span>
              {team.evaluation && (
                <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                  {team.evaluation.total_score}p
                </span>
              )}
              {isR1Eliminated && (
                <span className="px-1.5 py-0.2 rounded bg-gray-500/30 text-gray-300 text-[10px] font-bold">
                  COMPLETED
                </span>
              )}
            </button>

            {/* ROUND 2 TAB: ONLY VISIBLE IF TEAM QUALIFIED FROM ROUND 1 */}
            {isR1Qualified && (
              <button
                onClick={() => setSelectedRoundTab(2)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                  currentViewRound === 2
                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.4)]'
                    : 'text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <span>ROUND 2: REVERSE ENG</span>
                {team.round2?.totalScore > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                    {team.round2.totalScore}p
                  </span>
                )}
                {isR2Eliminated && (
                  <span className="px-1.5 py-0.2 rounded bg-gray-500/30 text-gray-300 text-[10px] font-bold">
                    COMPLETED
                  </span>
                )}
              </button>
            )}

            {/* ROUND 3 TAB: ONLY VISIBLE IF TEAM QUALIFIED FROM ROUND 2 */}
            {isR2Qualified && (
              <button
                onClick={() => setSelectedRoundTab(3)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                  currentViewRound === 3
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                    : 'text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                <span>ROUND 3: GRAND FINALE</span>
                {team.round3?.evaluation && (
                  <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
                    {team.round3.evaluation.total_score}p
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-gray-400 flex items-center gap-2 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Stage: Round {activeRound}</span>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // ROUND STATE RESOLUTION (Must run before any screen render)
  // ----------------------------------------------------
  const isRound1Active = (serverTimer?.timerRunning || serverTimer?.status === 'ACTIVE' || teamState?.roundState?.status === 'ACTIVE' || (!serverTimer?.isLocked && serverTimer?.isLocked !== undefined && !teamState?.roundState?.isLocked));
  const isRound2Active = teamState?.round2State?.status === 'ACTIVE' || teamState?.round2State?.timerRunning || serverTimer?.round2?.timerRunning || serverTimer?.round2?.status === 'ACTIVE';
  const isRound3Active = teamState?.round3State?.status === 'ACTIVE' || teamState?.round3State?.timerRunning || serverTimer?.round3?.timerRunning || serverTimer?.round3?.status === 'ACTIVE';

  const isLocked = !isRound1Active;
  const isSubmitted = team.submissionStatus === 'submitted' || team.submissionStatus === 'evaluated';
  const hasSpun = !!team.spinResult || hasRevealedGenre;
  const charCount = localDraft.length;
  const wordCount = localDraft.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = charCount >= 50 && !isSubmitted && !isLocked;

  // ----------------------------------------------------
  // 1. ELIMINATED TEAMS (STRICT LOCKOUT SCREEN)
  // If eliminated in Round 1, team CANNOT access Round 2 or Round 3
  // ----------------------------------------------------
  if (isR1Eliminated) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="max-w-3xl mx-auto px-4 py-12 text-center animate-fade-in">
          <div className="glass-panel w-full p-8 sm:p-10 rounded-3xl border-red-500/40 bg-gradient-to-b from-red-950/30 via-[#070a13]/90 to-[#070a13] shadow-[0_0_50px_rgba(255,60,60,0.2)]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,60,60,0.3)]">
              <XCircle className="w-10 h-10" />
            </div>

            <span className="px-4 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono font-bold uppercase tracking-widest">
              ROUND 1 CONCLUDED • TOP 50% ADVANCING
            </span>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-white mt-3 tracking-wider">
              BETTER LUCK NEXT TIME
            </h1>

            <p className="text-gray-300 font-sans text-base max-w-lg mx-auto mt-2">
              Thank you for competing in PROMPT WARS, <span className="text-red-300 font-bold">{team.name || user?.teamName}</span>! The top 50% of teams have advanced to Round 2.
            </p>

            {/* Score & Rank Display */}
            <div className="my-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-black/50 border border-red-500/30">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Total Round 1 Score</div>
                <div className="font-display font-black text-4xl text-red-400 mt-1">
                  {team.evaluation?.total_score ?? 0}
                  <span className="text-lg text-gray-500 font-normal"> / 20</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Final Arena Rank</div>
                <div className="font-display font-black text-4xl text-gray-200 mt-1">
                  #{team.rank || 'N/A'}
                </div>
              </div>
            </div>

            {/* 4-Criteria Rubric Breakdown */}
            {team.evaluation && (
              <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] text-left max-w-lg mx-auto space-y-3">
                <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Evaluation Rubric Breakdown
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] flex justify-between items-center">
                    <span className="text-gray-400">Clarity & Specificity:</span>
                    <span className="text-cyan-400 font-bold">{team.evaluation.clarity_score ?? 0}/5</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] flex justify-between items-center">
                    <span className="text-gray-400">Prompt Engineering:</span>
                    <span className="text-amber-400 font-bold">{team.evaluation.techniques_score ?? 0}/5</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] flex justify-between items-center">
                    <span className="text-gray-400">Structure & Format:</span>
                    <span className="text-emerald-400 font-bold">{team.evaluation.format_score ?? 0}/5</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] flex justify-between items-center">
                    <span className="text-gray-400">Creativity & Style:</span>
                    <span className="text-purple-400 font-bold">{team.evaluation.creativity_score ?? 0}/5</span>
                  </div>
                </div>

                {team.evaluation.reasoning && (
                  <div className="pt-2 text-xs text-gray-300 font-sans border-t border-white/[0.06]">
                    <strong className="text-gray-400 block mb-1">AI Evaluator Feedback:</strong>
                    <p className="italic leading-relaxed">{team.evaluation.reasoning}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recorded Prompt */}
            {(team.submittedPrompt || localDraft) && (
              <div className="mt-6 p-4 rounded-2xl bg-black/50 border border-white/[0.08] text-left max-w-lg mx-auto">
                <div className="text-xs font-mono text-gray-400 uppercase mb-2">Your Recorded Submission:</div>
                <div className="text-xs font-mono text-gray-300 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {team.submittedPrompt || localDraft}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. ROUND 3 VIEW (ONLY FOR QUALIFIED FINALISTS)
  // ----------------------------------------------------
  if (currentViewRound === 3) {
    if (!isR2Qualified) {
      return (
        <div>
          {renderRoundSwitcher()}
          <StudentRound2 team={team} round2State={teamState?.round2State} />
        </div>
      );
    }
    return (
      <div>
        {renderRoundSwitcher()}
        <StudentRound3 team={team} round3State={teamState?.round3State} />
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. ROUND 2 VIEW (ONLY FOR ROUND 1 QUALIFIED TEAMS)
  // ----------------------------------------------------
  if (currentViewRound === 2) {
    if (!isR1Qualified) {
      return null;
    }
    return (
      <div>
        {renderRoundSwitcher()}
        <StudentRound2 team={team} round2State={teamState?.round2State} />
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUND 1 CORE WORKSPACE
  // ----------------------------------------------------

  // 0. GLOBAL LOBBY GATE: If Round 1 is locked AND team hasn't spun yet, show lobby
  if (isLocked && !hasSpun && !isSubmitted && activeRound === 1) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="min-h-[calc(100vh-8rem)] max-w-3xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center animate-fade-in">
          {/* Pulsing Beacon */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.3)] animate-cyber-pulse">
              <Sparkles className="w-12 h-12 text-cyan-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
            </span>
          </div>

          <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono text-xs uppercase tracking-widest font-bold">
            ARENA LOBBY • WAITING FOR HOST
          </span>

          <h1 className="font-display font-black text-3xl sm:text-5xl text-white mt-4 tracking-wider">
            WELCOME, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{team.name || user?.teamName || 'WARRIOR'}</span>!
          </h1>
          <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-lg font-sans">
            You are officially registered and connected to the PROMPT WARS tournament arena.
          </p>

          {/* Glass Status Card */}
          <div className="glass-panel w-full mt-8 p-6 sm:p-8 rounded-3xl border-cyan-500/30 bg-gradient-to-b from-[#0d1424]/90 to-[#070a13]/90 shadow-[0_0_40px_rgba(0,240,255,0.1)] text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold uppercase tracking-wider">Arena Connection Active</span>
              </div>
              <div className="text-xs font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-xl">
                ⏳ Stage: Waiting for Host to Start
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] text-xs text-gray-300 leading-relaxed font-sans">
              <strong className="text-white block mb-1">🎮 What happens next?</strong>
              Please keep this tab open and stand by. As soon as the host starts Round 1 from the host control dashboard, this screen will automatically activate the <strong>Genre Sector Wheel</strong> and start the timer.
            </div>

            <div className="pt-2 flex items-center text-xs font-mono text-gray-400">
              <span>Team: <strong className="text-cyan-300">{team.name || user?.teamName}</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. SPIN WHEEL SCREEN (Immediately accessible when unlocked in Round 1)
  if (!hasSpun && !isSubmitted) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="min-h-[calc(100vh-8rem)] max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center animate-fade-in">
          <div className="text-center mb-6">
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono text-xs uppercase tracking-wider">
              ROUND 1 • RANDOMIZED GENRE SECTOR ALLOTMENT
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white mt-2 tracking-wider">
              SPIN TO REVEAL YOUR GENRE
            </h2>
            <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
              Click the wheel to spin. Your sector will assign the defective prompt you must reconstruct.
            </p>
          </div>
          <WheelSpinner onSpinEnd={handleSpinEnd} />
        </div>
      </div>
    );
  }

  // 2. POST-ROUND 1 ADVANCEMENT VERDICT CELEBRATION (For Qualified Teams)
  if (isR1Qualified && !selectedRoundTab && isR1AdvanceTriggered && activeRound === 1) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="max-w-3xl mx-auto px-4 py-12 text-center animate-fade-in">
          <div className="glass-panel w-full p-8 sm:p-10 rounded-3xl border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 via-[#070a13]/80 to-[#070a13] shadow-[0_0_50px_rgba(0,255,136,0.2)]">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(0,255,136,0.4)] animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <span className="px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold uppercase tracking-widest">
              OFFICIAL VERDICT • ADVANCING
            </span>

            <h1 className="font-display font-black text-4xl sm:text-5xl text-white mt-3 tracking-wider">
              🎉 QUALIFIED FOR ROUND 2!
            </h1>

            <p className="text-gray-300 font-sans text-base max-w-lg mx-auto mt-2">
              Outstanding performance, <span className="text-emerald-400 font-bold">{team.name}</span>! Your prompt placed you in the qualifying bracket.
            </p>

            <div className="my-8 p-6 rounded-2xl bg-black/40 border border-emerald-500/30 max-w-md mx-auto">
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400">Total Round 1 Score</div>
              <div className="font-display font-black text-6xl text-emerald-400 mt-1 drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]">
                {team.evaluation?.total_score || 0}
                <span className="text-2xl text-gray-500 font-normal"> / 20</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedRoundTab(2)}
              className="cyber-btn px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 mx-auto shadow-[0_0_25px_rgba(0,255,136,0.5)]"
            >
              <span>ENTER ROUND 2: REVERSE ENGINEERING</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. POST-SUBMIT WAITING ROOM (Round 1 only, while waiting for evaluation/advancement)
  if (isSubmitted && activeRound === 1 && !isR1AdvanceTriggered) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="min-h-[calc(100vh-8rem)] max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(0,240,255,0.3)] animate-pulse">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs uppercase tracking-wider">
            SUBMISSION LOCKED & RECORDED
          </span>

          <h2 className="font-display font-black text-3xl sm:text-4xl text-white mt-2 tracking-wider">
            PROMPT SUBMITTED FOR AI EVALUATION
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Your prompt has been locked. Stand by while the AI Adjudicator grades all submissions.
          </p>

          <div className="glass-panel w-full text-left mt-8 p-6 rounded-2xl border-cyan-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3 text-xs font-mono text-gray-400">
              <span>RECORDED PROMPT SUBMISSION:</span>
              <span>{team.submittedPrompt?.length || localDraft.length} chars</span>
            </div>
            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] font-mono text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {team.submittedPrompt || localDraft}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. MAIN ROUND 1 MAKEOVER STUDIO - CLEAN & CRISP GLASSMORPHISM
  const genre = team.assignedGenre || { name: 'CREATIVE', color: '#ff007f', badge: 'CREATIVE ARTS' };
  const question = team.assignedQuestion || {
    badPrompt: "Make an advertisement for a college fest.",
    context: "An upcoming 3-day inter-college technical and cultural festival.",
    missingElements: ["Audience Demographics", "Tone & Personality", "Format Specification", "Call To Action"]
  };

  return (
    <div>
      {renderRoundSwitcher()}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between shadow-lg">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Top Genre & Question in Prompt Card (Glassmorphic) */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-500/30 bg-gradient-to-br from-[#0d1424]/90 via-[#070a13]/80 to-[#0d1424]/90 shadow-[0_0_40px_rgba(0,240,255,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <span 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-xl border shadow-md"
                style={{ 
                  backgroundColor: `${genre.color}25`, 
                  color: genre.color, 
                  borderColor: `${genre.color}60`
                }}
              >
                {team.spinResult || 'A'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-lg text-white tracking-wider">
                    GENRE {team.spinResult || 'A'}: {genre.name}
                  </span>
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono border"
                    style={{ 
                      backgroundColor: `${genre.color}20`, 
                      color: genre.color,
                      borderColor: `${genre.color}40`
                    }}
                  >
                    {genre.badge || 'CATEGORY'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-sans">{genre.description}</p>
              </div>
            </div>

            <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-gray-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Goal: <strong className="text-white">{question.context}</strong></span>
            </div>
          </div>

          {/* Assigned Bad Prompt */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                PROMPT IN QUESTION (DEFECTIVE):
              </span>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-red-500/40 text-red-200 font-mono text-base sm:text-lg leading-relaxed shadow-inner">
              "{question.badPrompt}"
            </div>
          </div>
        </div>

        {/* Answer Box & Submission Studio */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-cyan-500/40 bg-gradient-to-b from-[#0d1424]/95 via-[#070a13]/90 to-[#070a13]/95 shadow-[0_0_50px_rgba(0,240,255,0.12)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-cyan-400" />
              <span className="font-display font-bold text-lg tracking-wider text-cyan-300">
                YOUR RECONSTRUCTED PROMPT (ANSWER)
              </span>
            </div>

            {isAutoSaving ? (
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Autosaved
              </span>
            )}
          </div>

          {/* Clean Textarea */}
          <textarea
            rows={12}
            placeholder="Type your improved, high-precision prompt here... Specify role persona, clear context, strict constraints, and explicit output formatting."
            value={localDraft}
            onChange={handleDraftChange}
            disabled={isSubmitted || isLocked}
            className="w-full p-4 sm:p-5 rounded-2xl glass-input text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-400 resize-none shadow-inner transition-colors"
          />

          {/* Metrics bar */}
          <div className="mt-3 flex items-center justify-between text-xs font-mono text-gray-400">
            <span className={charCount < 50 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {charCount < 50 ? `Min 50 characters required (${50 - charCount} left)` : '✓ Valid Length'}
            </span>
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} / 2500 chars</span>
            </div>
          </div>

          {/* Action Buttons: Test in Sandbox & Lock and Submit */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowSandbox(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl font-mono text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/40 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span>Test in Sandbox ({sandboxRunsLeft} runs left)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={!canSubmit || isSubmitting}
              className={`cyber-btn w-full sm:w-auto px-8 py-3.5 rounded-2xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${
                !canSubmit
                  ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_30px_rgba(0,240,255,0.45)]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'SUBMITTING...' : 'LOCK & SUBMIT PROMPT'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Prompt Testing Sandbox Modal */}
        <PromptSandboxModal
          isOpen={showSandbox}
          onClose={() => setShowSandbox(false)}
          round={1}
          challengeType="prompt"
          promptText={localDraft}
          runsRemaining={sandboxRunsLeft}
          onRunSandbox={handleRunSandbox}
          title="Round 1: Prompt Makeover Live Sandbox"
        />

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border-cyan-500/50 shadow-2xl">
              <h3 className="font-display font-bold text-xl text-white mb-2">
                CONFIRM FINAL SUBMISSION
              </h3>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                Are you ready to submit your improved prompt for AI evaluation? Once submitted, your prompt cannot be modified.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-gray-300 text-sm font-semibold hover:bg-white/[0.1] transition-colors"
                >
                  BACK TO EDIT
                </button>
                <button 
                  onClick={handleSubmitPrompt} 
                  className="cyber-btn py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-display font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                >
                  YES, SUBMIT NOW
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
