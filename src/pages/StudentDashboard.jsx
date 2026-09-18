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
  const { user } = useAuth();
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
  const activeRound = teamState?.activeRound || 1;
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
    if (team?.draftPrompt && !localDraft) {
      setLocalDraft(team.draftPrompt);
    }
  }, [team]);

  // If team already has spin result, set revealed
  useEffect(() => {
    if (team?.spinResult) {
      setHasRevealedGenre(true);
    }
  }, [team?.spinResult]);

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

  // Quick template insertion helper
  const handleInsertTemplate = (snippet) => {
    setLocalDraft(prev => {
      const updated = prev ? `${prev}\n\n${snippet}` : snippet;
      if (socket && user?.teamId) {
        socket.emit('team:draft_update', {
          teamId: user.teamId,
          draftText: updated
        });
      }
      return updated;
    });
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
  // TOURNAMENT ROUND ROUTER & NAVIGATION
  // ----------------------------------------------------
  const renderRoundSwitcher = () => {
    if (!team.isQualified && activeRound === 1) return null;

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
            </button>

            {team.isQualified && (
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
              </button>
            )}

            {(team.round2?.isQualified || activeRound === 3) && (
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

  // If explicitly viewing Round 3
  if (currentViewRound === 3) {
    return (
      <div>
        {renderRoundSwitcher()}
        <StudentRound3 team={team} round3State={teamState?.round3State} />
      </div>
    );
  }

  // If explicitly viewing Round 2
  if (currentViewRound === 2) {
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
  const isLocked = serverTimer.isLocked || teamState?.roundState?.isLocked;
  const isSubmitted = team.submissionStatus === 'submitted' || team.submissionStatus === 'evaluated';
  const hasSpun = !!team.spinResult || hasRevealedGenre;
  const charCount = localDraft.length;
  const wordCount = localDraft.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = charCount >= 50 && !isSubmitted && !isLocked;

  // 1. SPIN WHEEL SCREEN (Immediately accessible on entrance)
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

  // 3. POST-ROUND ADVANCEMENT VERDICT SCREEN
  if (team.isQualified !== null && team.isQualified !== undefined && !selectedRoundTab && teamState?.roundState?.advanceTriggered) {
    return (
      <div>
        {renderRoundSwitcher()}
        <div className="max-w-3xl mx-auto px-4 py-12 text-center animate-fade-in">
          {team.isQualified ? (
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
                Outstanding performance, <span className="text-emerald-400 font-bold">{team.name}</span>! Your prompt placed you in the top 50%.
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
          ) : (
            <div className="glass-panel w-full p-8 sm:p-10 rounded-3xl border-red-500/40 bg-gradient-to-b from-red-950/20 to-[#070a13]">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10" />
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-3 tracking-wider">
                BETTER LUCK NEXT TIME
              </h1>
              <p className="text-gray-300 font-sans text-sm max-w-md mx-auto mt-2">
                Thank you for competing in PROMPT WARS! Your score was {team.evaluation?.total_score || 0}/20.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. POST-SUBMIT WAITING ROOM
  if (isSubmitted && !teamState?.roundState?.advanceTriggered) {
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

  // 5. MAIN ROUND 1 MAKEOVER STUDIO
  const genre = team.assignedGenre || { name: 'CREATIVE', color: '#ff007f', badge: 'CREATIVE ARTS' };
  const question = team.assignedQuestion || {
    badPrompt: "Make an advertisement for a college fest.",
    context: "An upcoming 3-day inter-college technical and cultural festival.",
    missingElements: ["Audience Demographics", "Tone & Personality", "Format Specification", "Call To Action"]
  };

  return (
    <div>
      {renderRoundSwitcher()}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between shadow-lg">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Top Genre & Category Card with Glassmorphism */}
        <div className="glass-panel p-5 rounded-2xl border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-3xl shadow-xl shrink-0 border"
              style={{ 
                backgroundColor: `${genre.color}20`, 
                color: genre.color, 
                borderColor: `${genre.color}60`,
                boxShadow: `0 0 25px ${genre.color}30`
              }}
            >
              {team.spinResult || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-black text-2xl text-white tracking-wider">
                  GENRE {team.spinResult}: {genre.name}
                </span>
                <span 
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono border"
                  style={{ 
                    backgroundColor: `${genre.color}25`, 
                    color: genre.color,
                    borderColor: `${genre.color}50`
                  }}
                >
                  {genre.badge || 'CATEGORY'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-sans">{genre.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-black/40 px-3.5 py-2 rounded-xl border border-white/[0.08]">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400">Context:</span>
            <span className="text-gray-200 font-semibold truncate max-w-xs">{question.context}</span>
          </div>
        </div>

        {/* 2-Column Makeover Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (5/12): Defective Prompt Brief & Target Scenario */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-2xl border-red-500/30 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-400 animate-pulse" />
                    <span className="font-display font-bold text-lg tracking-wider text-red-400">
                      BAD PROMPT (ASSIGNED)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30">
                    DEFECTIVE
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-red-500/40 text-red-200 font-mono text-base leading-relaxed shadow-inner">
                  "{question.badPrompt}"
                </div>

                {/* Target Scenario & Desired Output Context */}
                <div className="mt-5 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
                      Target Scenario & Deliverable:
                    </h4>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-gray-200 leading-relaxed font-sans">
                    {question.context}
                  </div>
                </div>
              </div>

              {/* Rubric Criteria Box */}
              <div className="mt-5 p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                  <span>20-Point AI Adjudication Framework:</span>
                </div>
                <div className="text-[11px] text-gray-400 space-y-0.5 font-mono">
                  <div>• Clarity & Specificity (5 pts) • Persona & Role (4 pts)</div>
                  <div>• Constraints & Guardrails (4 pts) • Output Structure (3 pts)</div>
                  <div>• Creativity & Quality (4 pts)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7/12): Live Improved Prompt Editor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-2xl border-cyan-500/40 flex-1 flex flex-col justify-between shadow-[0_0_35px_rgba(0,240,255,0.1)]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-cyan-400" />
                    <span className="font-display font-bold text-lg text-cyan-300">
                      YOUR IMPROVED PROMPT
                    </span>
                  </div>
                  {isAutoSaving ? (
                    <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Saving draft...
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Autosaved
                    </span>
                  )}
                </div>

                {/* Quick-Insert Framework Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="text-[11px] font-mono text-gray-400 pr-1">Quick Add:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate("Act as an expert [Role/Persona] with 10+ years experience in [Domain].")}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-500/40 text-[11px] font-mono text-gray-300 hover:text-cyan-300 transition-colors"
                  >
                    + Persona
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate("CONSTRAINTS:\n- Tone: Professional, high-energy, concise\n- Must avoid: Clichés and vague generalizations\n- Budget/Timeline: Explicit limits")}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-500/40 text-[11px] font-mono text-gray-300 hover:text-cyan-300 transition-colors"
                  >
                    + Constraints
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate("OUTPUT STRUCTURE:\n1. Executive Summary\n2. Detailed Strategy Breakdown (Markdown Table)\n3. Actionable Next Steps & KPIs")}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-500/40 text-[11px] font-mono text-gray-300 hover:text-cyan-300 transition-colors"
                  >
                    + Markdown Schema
                  </button>
                </div>

                {/* Main Textarea */}
                <textarea
                  rows={14}
                  placeholder="Draft your powerhouse improved prompt here... (e.g. 'Act as a Senior Creative Director...')"
                  value={localDraft}
                  onChange={handleDraftChange}
                  disabled={isSubmitted || isLocked}
                  className="w-full p-4 rounded-xl glass-input text-gray-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500/80 resize-none shadow-inner"
                />

                <div className="mt-2 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className={charCount < 50 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
                    {charCount < 50 ? `Min 50 chars required (${50 - charCount} left)` : '✓ Valid Length'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span>{charCount} / 2500 chars</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSandbox(true)}
                    className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/40 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                  >
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    <span>Test in Live Sandbox ({sandboxRunsLeft} left)</span>
                  </button>
                  <div className="hidden sm:flex text-xs text-gray-400 font-mono items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Single final submission</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!canSubmit || isSubmitting}
                  className={`cyber-btn px-8 py-3.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${
                    !canSubmit
                      ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_25px_rgba(0,240,255,0.45)]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'SUBMITTING...' : 'LOCK & SUBMIT PROMPT'}</span>
                </button>
              </div>
            </div>
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
